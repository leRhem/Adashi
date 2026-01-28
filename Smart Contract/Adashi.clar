;; ============================================================================
;; COOPERATIVE SAVINGS V2.1 - PUBLIC & PRIVATE GROUPS
;; ============================================================================
;; Features:
;; - Private Groups: Creator adds members manually (original behavior)
;; - Public Groups: Users join themselves during enrollment periods
;; - Three operational models (ROSCA, Collective Savings, Interest-bearing)
;; - Democratic mode switching with unanimous voting
;; - Enrollment periods at cycle boundaries
;; - Auto-assignment of positions by join order (FIFO)
;; ============================================================================

;; ============================================================================
;; CONSTANTS - Error Codes
;; ============================================================================

(define-constant ERR_AUTH (err u300))
(define-constant ERR_NOT_YOUR_TURN (err u301))
(define-constant ERR_TRANSFER_FAILED (err u302))
(define-constant ERR_NO_BALANCE (err u303))
(define-constant ERR_EMPTY_NAME (err u304))
(define-constant ERR_MAX_MEMBERS (err u305))
(define-constant ERR_GROUP_NOT_FOUND (err u306))
(define-constant ERR_ALREADY_MEMBER (err u307))
(define-constant ERR_NOT_MEMBER (err u308))
(define-constant ERR_ALREADY_PAID (err u309))
(define-constant ERR_NOT_TIME_YET (err u310))
(define-constant ERR_GRACE_PERIOD_ENDED (err u311))
(define-constant ERR_INSUFFICIENT_CONTRIBUTIONS (err u312))
(define-constant ERR_INVALID_PAYOUT_POSITION (err u313))
(define-constant ERR_ALREADY_RECEIVED_PAYOUT (err u314))
(define-constant ERR_GROUP_COMPLETED (err u315))
(define-constant ERR_INVALID_MODE (err u316))
(define-constant ERR_MODE_CHANGE_PENDING (err u317))
(define-constant ERR_ALREADY_VOTED (err u318))
(define-constant ERR_NOT_ALL_CYCLES_COMPLETE (err u319))
(define-constant ERR_WITHDRAWAL_NOT_AVAILABLE (err u320))
(define-constant ERR_ALREADY_WITHDRAWN (err u321))
(define-constant ERR_CYCLE_IN_PROGRESS (err u322))
(define-constant ERR_ENROLLMENT_CLOSED (err u323))
(define-constant ERR_INVALID_GROUP_TYPE (err u324))
(define-constant ERR_GROUP_NOT_PUBLIC (err u325))

;; ============================================================================
;; CONSTANTS - Group Modes & Types
;; ============================================================================

(define-constant MODE_TRADITIONAL_ROSCA u1)
(define-constant MODE_COLLECTIVE_SAVINGS u2)
(define-constant MODE_INTEREST_BEARING u3)

(define-constant GROUP_TYPE_PRIVATE u1)
(define-constant GROUP_TYPE_PUBLIC u2)

;; ============================================================================
;; CONSTANTS - Status Codes
;; ============================================================================

(define-constant STATUS_ENROLLMENT u0)      ;; Public groups accepting members
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_COMPLETED u2)
(define-constant STATUS_PAUSED u3)
(define-constant STATUS_WITHDRAWAL_OPEN u4)

;; Maximum members for practical gas limits
(define-constant MAX_MEMBERS_LIMIT u100)

;; Grace period in blocks (approximately 10 days = 1440 blocks)
;; PLUS 2-block safety buffer to prevent edge-case timing failures
(define-constant GRACE_PERIOD_BLOCKS u1440)
(define-constant GRACE_SAFETY_BUFFER u2)  ;; NEW: 2-block buffer

;; ============================================================================
;; DATA STRUCTURES
;; ============================================================================

;; Main group information
(define-map groups
  { group_id: (string-utf8 50) }
  {
    creator: principal,
    name: (string-utf8 100),
    description: (optional (string-utf8 256)),
    deposit_per_member: uint,
    cycle_duration_blocks: uint,
    max_members: uint,  ;; 0 = unlimited (capped at MAX_MEMBERS_LIMIT)
    members_count: uint,
    current_cycle: uint,
    cycle_start_block: uint,
    status: uint,
    total_pool_balance: uint,
    created_at: uint,
    ;; Multi-model support
    group_mode: uint,
    ;; Mode change voting
    pending_mode_change: (optional uint),
    mode_change_votes_for: uint,
    mode_change_votes_against: uint,
    ;; NEW: Public/Private
    group_type: uint,  ;; 1=Private, 2=Public
    enrollment_period_blocks: uint,  ;; How long enrollment stays open
    enrollment_end_block: uint,  ;; When current enrollment closes
    auto_start_when_full: bool,  ;; Start automatically when full?
    is_public_listed: bool  ;; Show in public listings?
  }
)

;; Member information within a group
(define-map group_members
  { 
    group_id: (string-utf8 50),
    member_address: principal
  }
  {
    member_name: (string-utf8 100),
    payout_position: uint,
    has_received_payout: bool,
    joined_at: uint,
    total_contributed: uint,
    has_withdrawn: bool,
    voted_on_mode_change: bool,
    vote_for_mode_change: bool
  }
)

;; Track contributions per member per cycle
(define-map contributions
  {
    group_id: (string-utf8 50),
    member_address: principal,
    cycle: uint
  }
  {
    amount: uint,
    paid_at_block: uint,
    is_paid: bool
  }
)

;; NEW: Track public groups for discovery
(define-map public_group_index
  uint  ;; Sequential index
  (string-utf8 50)  ;; group_id
)

(define-data-var public-group-count uint u0)

;; ============================================================================
;; HELPER FUNCTIONS - Private Read-Only
;; ============================================================================

(define-private (is-creator (group_id (string-utf8 50)) (caller principal))
  (match (map-get? groups { group_id: group_id })
    group-data (is-eq caller (get creator group-data))
    false
  )
)

(define-private (is-member (group_id (string-utf8 50)) (caller principal))
  (is-some (map-get? group_members { group_id: group_id, member_address: caller }))
)

(define-private (has-paid-current-cycle (group_id (string-utf8 50)) (member principal) (cycle uint))
  (match (map-get? contributions { group_id: group_id, member_address: member, cycle: cycle })
    contribution-data (get is_paid contribution-data)
    false
  )
)

(define-private (get-current-cycle-deadline (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data 
      (+ 
        (get cycle_start_block group-data)
        (* (get current_cycle group-data) (get cycle_duration_blocks group-data))
      )
    u0
  )
)

(define-private (get-grace-period-deadline (group_id (string-utf8 50)))
  (+ (get-current-cycle-deadline group_id) GRACE_PERIOD_BLOCKS GRACE_SAFETY_BUFFER)
)

(define-private (is-valid-mode (mode uint))
  (or 
    (is-eq mode MODE_TRADITIONAL_ROSCA)
    (or
      (is-eq mode MODE_COLLECTIVE_SAVINGS)
      (is-eq mode MODE_INTEREST_BEARING)
    )
  )
)

(define-private (is-valid-group-type (group_type uint))
  (or (is-eq group_type GROUP_TYPE_PRIVATE) (is-eq group_type GROUP_TYPE_PUBLIC))
)

(define-private (all-members-voted (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (let
      (
        (votes-counted (+ (get mode_change_votes_for group-data) (get mode_change_votes_against group-data)))
        (total-members (get members_count group-data))
      )
      (is-eq votes-counted total-members)
    )
    false
  )
)

(define-private (mode-change-approved (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (let
      (
        (votes-for (get mode_change_votes_for group-data))
        (total-members (get members_count group-data))
      )
      (is-eq votes-for total-members)
    )
    false
  )
)

;; NEW: Check if enrollment is open
(define-private (is-enrollment-open (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (and
      (is-eq (get status group-data) STATUS_ENROLLMENT)
      (<= stacks-block-height (get enrollment_end_block group-data))
    )
    false
  )
)

;; NEW: Get effective max members (handle unlimited = 0)
(define-private (get-effective-max-members (max_members uint))
  (if (is-eq max_members u0)
    MAX_MEMBERS_LIMIT
    (if (> max_members MAX_MEMBERS_LIMIT)
      MAX_MEMBERS_LIMIT
      max_members
    )
  )
)

;; NEW: Check if group is full
(define-private (is-group-full (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (let
      (
        (effective-max (get-effective-max-members (get max_members group-data)))
      )
      (>= (get members_count group-data) effective-max)
    )
    false
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Group Creation
;; ============================================================================

;; Create a PRIVATE group (original behavior)
(define-public (create-private-group
  (group_id (string-utf8 50))
  (name (string-utf8 100))
  (description (optional (string-utf8 256)))
  (deposit_per_member uint)
  (cycle_duration_blocks uint)
  (max_members uint)
  (group_mode uint)
)
  (let
    (
      (creator tx-sender)
    )
    ;; Validations
    (asserts! (> (len name) u0) ERR_EMPTY_NAME)
    (asserts! (is-none (map-get? groups { group_id: group_id })) ERR_ALREADY_MEMBER)
    (asserts! (> deposit_per_member u0) ERR_NO_BALANCE)
    (asserts! (> cycle_duration_blocks u0) ERR_NOT_TIME_YET)
    (asserts! (> max_members u1) ERR_MAX_MEMBERS)
    (asserts! (is-valid-mode group_mode) ERR_INVALID_MODE)

    ;; Create group
    (map-set groups
      { group_id: group_id }
      {
        creator: creator,
        name: name,
        description: description,
        deposit_per_member: deposit_per_member,
        cycle_duration_blocks: cycle_duration_blocks,
        max_members: max_members,
        members_count: u0,
        current_cycle: u0,
        cycle_start_block: stacks-block-height,
        status: STATUS_ACTIVE,
        total_pool_balance: u0,
        created_at: stacks-block-height,
        group_mode: group_mode,
        pending_mode_change: none,
        mode_change_votes_for: u0,
        mode_change_votes_against: u0,
        group_type: GROUP_TYPE_PRIVATE,
        enrollment_period_blocks: u0,
        enrollment_end_block: u0,
        auto_start_when_full: false,
        is_public_listed: false
      }
    )
    
    (ok true)
  )
)

;; NEW: Create a PUBLIC group (users can join themselves)
(define-public (create-public-group
  (group_id (string-utf8 50))
  (name (string-utf8 100))
  (description (optional (string-utf8 256)))
  (deposit_per_member uint)
  (cycle_duration_blocks uint)
  (max_members uint)  ;; 0 = unlimited (capped at 100)
  (group_mode uint)
  (enrollment_period_blocks uint)  ;; How long enrollment stays open
  (auto_start_when_full bool)
)
  (let
    (
      (creator tx-sender)
      (enrollment_end (+ stacks-block-height enrollment_period_blocks))
      (public_index (var-get public-group-count))
    )
    ;; Validations
    (asserts! (> (len name) u0) ERR_EMPTY_NAME)
    (asserts! (is-none (map-get? groups { group_id: group_id })) ERR_ALREADY_MEMBER)
    (asserts! (> deposit_per_member u0) ERR_NO_BALANCE)
    (asserts! (> cycle_duration_blocks u0) ERR_NOT_TIME_YET)
    (asserts! (is-valid-mode group_mode) ERR_INVALID_MODE)
    (asserts! (> enrollment_period_blocks u0) ERR_NOT_TIME_YET)

    ;; Create group
    (map-set groups
      { group_id: group_id }
      {
        creator: creator,
        name: name,
        description: description,
        deposit_per_member: deposit_per_member,
        cycle_duration_blocks: cycle_duration_blocks,
        max_members: max_members,
        members_count: u0,
        current_cycle: u0,
        cycle_start_block: stacks-block-height,
        status: STATUS_ENROLLMENT,  ;; Start in enrollment mode
        total_pool_balance: u0,
        created_at: stacks-block-height,
        group_mode: group_mode,
        pending_mode_change: none,
        mode_change_votes_for: u0,
        mode_change_votes_against: u0,
        group_type: GROUP_TYPE_PUBLIC,
        enrollment_period_blocks: enrollment_period_blocks,
        enrollment_end_block: enrollment_end,
        auto_start_when_full: auto_start_when_full,
        is_public_listed: true
      }
    )

    ;; Add to public index
    (map-set public_group_index public_index group_id)
    (var-set public-group-count (+ public_index u1))
    
    (ok true)
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Membership (Private Groups)
;; ============================================================================

;; Add member to PRIVATE group (creator only, manual position)
(define-public (add-member
  (group_id (string-utf8 50))
  (member_address principal)
  (member_name (string-utf8 100))
  (payout_position uint)
)
  (match (map-get? groups { group_id: group_id }) 
    group-data
    (begin
      ;; Validations
      (asserts! (is-eq tx-sender (get creator group-data)) ERR_AUTH)
      (asserts! (is-eq (get group_type group-data) GROUP_TYPE_PRIVATE) ERR_GROUP_NOT_PUBLIC)
      (asserts! 
        (is-none (map-get? group_members { group_id: group_id, member_address: member_address }))
        ERR_ALREADY_MEMBER
      )
      (asserts! 
        (< (get members_count group-data) (get max_members group-data))
        ERR_MAX_MEMBERS
      )
      (asserts! 
        (and (> payout_position u0) (<= payout_position (get max_members group-data)))
        ERR_INVALID_PAYOUT_POSITION
      )

      ;; Add member
      (map-set group_members
        { group_id: group_id, member_address: member_address }
        {
          member_name: member_name,
          payout_position: payout_position,
          has_received_payout: false,
          joined_at: stacks-block-height,
          total_contributed: u0,
          has_withdrawn: false,
          voted_on_mode_change: false,
          vote_for_mode_change: false
        }
      )

      ;; Update group member count
      (map-set groups
        { group_id: group_id }
        (merge group-data { members_count: (+ (get members_count group-data) u1) })
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Membership (Public Groups)
;; ============================================================================

;; NEW: Join a PUBLIC group (self-service) - RACE CONDITION SAFE
(define-public (join-public-group
  (group_id (string-utf8 50))
  (member_name (string-utf8 100))
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (let
      (
        (current-members (get members_count group-data))
        (effective-max (get-effective-max-members (get max_members group-data)))
      )
      ;; Validations BEFORE incrementing
      (asserts! (is-eq (get group_type group-data) GROUP_TYPE_PUBLIC) ERR_INVALID_GROUP_TYPE)
      (asserts! (is-enrollment-open group_id) ERR_ENROLLMENT_CLOSED)
      (asserts! 
        (is-none (map-get? group_members { group_id: group_id, member_address: tx-sender }))
        ERR_ALREADY_MEMBER
      )
      (asserts! (< current-members effective-max) ERR_MAX_MEMBERS)

      ;; ATOMIC INCREMENT: Update count FIRST
      (map-set groups
        { group_id: group_id }
        (merge group-data { members_count: (+ current-members u1) })
      )

      ;; READ-AFTER-WRITE: Get the ACTUAL position from updated group
      (let
        (
          (updated-group-data (unwrap-panic (map-get? groups { group_id: group_id })))
          (assigned-position (get members_count updated-group-data))
        )
        
        ;; Add member with GUARANTEED unique position
        (map-set group_members
          { group_id: group_id, member_address: tx-sender }
          {
            member_name: member_name,
            payout_position: assigned-position,  ;; Position from atomic increment
            has_received_payout: false,
            joined_at: stacks-block-height,
            total_contributed: u0,
            has_withdrawn: false,
            voted_on_mode_change: false,
            vote_for_mode_change: false
          }
        )

        ;; Check if should auto-start
        (if (and 
              (get auto_start_when_full group-data)
              (is-eq assigned-position effective-max))
          ;; Group is full and auto-start enabled
          (map-set groups
            { group_id: group_id }
            (merge (unwrap-panic (map-get? groups { group_id: group_id }))
              {
                status: STATUS_ACTIVE,
                current_cycle: u1,
                cycle_start_block: stacks-block-height
              }
            )
          )
          true  ;; Do nothing if not full yet
        )

        (ok true)
      )
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; NEW: Open new enrollment period (for public groups between cycles)
(define-public (open-enrollment-period
  (group_id (string-utf8 50))
  (enrollment_period_blocks uint)
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-eq (get group_type group-data) GROUP_TYPE_PUBLIC) ERR_INVALID_GROUP_TYPE)
      (asserts! (> enrollment_period_blocks u0) ERR_NOT_TIME_YET)

      ;; Open enrollment
      (map-set groups
        { group_id: group_id }
        (merge group-data
          {
            status: STATUS_ENROLLMENT,
            enrollment_end_block: (+ stacks-block-height enrollment_period_blocks)
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; NEW: Close enrollment and start cycle (manual trigger)
(define-public (close-enrollment-and-start
  (group_id (string-utf8 50))
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-eq (get group_type group-data) GROUP_TYPE_PUBLIC) ERR_INVALID_GROUP_TYPE)
      (asserts! (is-eq (get status group-data) STATUS_ENROLLMENT) ERR_ENROLLMENT_CLOSED)

      ;; Close enrollment and start
      (map-set groups
        { group_id: group_id }
        (merge group-data
          {
            status: STATUS_ACTIVE,
            current_cycle: (+ (get current_cycle group-data) u1),
            cycle_start_block: stacks-block-height
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Cycle Management
;; ============================================================================

;; Start the first cycle (private groups only, original function)
(define-public (start-first-cycle (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-eq tx-sender (get creator group-data)) ERR_AUTH)
      (asserts! (is-eq (get current_cycle group-data) u0) ERR_ALREADY_PAID)
      (asserts! 
        (is-eq (get members_count group-data) (get max_members group-data))
        ERR_MAX_MEMBERS
      )

      ;; Start cycle 1
      (map-set groups
        { group_id: group_id }
        (merge group-data 
          { 
            current_cycle: u1,
            cycle_start_block: stacks-block-height,
            status: STATUS_ACTIVE
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Contributions (Same for Public & Private)
;; ============================================================================

;; Member deposits their contribution for current cycle
(define-public (deposit (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (match (map-get? group_members { group_id: group_id, member_address: tx-sender })
      member-data
      (let
        (
          (current_cycle (get current_cycle group-data))
          (deposit_amount (get deposit_per_member group-data))
          (grace_deadline (get-grace-period-deadline group_id))
        )
        ;; Validations
        (asserts! (> current_cycle u0) ERR_NOT_TIME_YET)
        (asserts! (is-eq (get status group-data) STATUS_ACTIVE) ERR_GROUP_COMPLETED)
        (asserts! 
          (not (has-paid-current-cycle group_id tx-sender current_cycle))
          ERR_ALREADY_PAID
        )
        (asserts! (<= stacks-block-height grace_deadline) ERR_GRACE_PERIOD_ENDED)

        ;; Transfer STX to contract
        (try! (stx-transfer? deposit_amount tx-sender (as-contract tx-sender)))

        ;; Record contribution
        (map-set contributions
          { group_id: group_id, member_address: tx-sender, cycle: current_cycle }
          {
            amount: deposit_amount,
            paid_at_block: stacks-block-height,
            is_paid: true
          }
        )

        ;; Update member total contributed
        (map-set group_members
          { group_id: group_id, member_address: tx-sender }
          (merge member-data
            {
              total_contributed: (+ (get total_contributed member-data) deposit_amount)
            }
          )
        )

        ;; Update pool balance
        (map-set groups
          { group_id: group_id }
          (merge group-data 
            { 
              total_pool_balance: (+ (get total_pool_balance group-data) deposit_amount)
            }
          )
        )

        (ok true)
      )
      ERR_NOT_MEMBER
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - Payouts & Withdrawals
;; (Same as V2 - including claim-payout, withdraw-savings, etc.)
;; ============================================================================

;; Member claims their payout when it's their turn (Model 1 only)
(define-public (claim-payout (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (match (map-get? group_members { group_id: group_id, member_address: tx-sender })
      member-data
      (let
        (
          (current_cycle (get current_cycle group-data))
          (payout_amount (* (get members_count group-data) (get deposit_per_member group-data)))
          (recipient tx-sender)
        )
        ;; Validations
        (asserts! (is-eq (get group_mode group-data) MODE_TRADITIONAL_ROSCA) ERR_INVALID_MODE)
        (asserts! (is-eq (get status group-data) STATUS_ACTIVE) ERR_GROUP_COMPLETED)
        
        ;; NEW: Time Check - prevent early claiming
        (asserts! (>= stacks-block-height (get-current-cycle-deadline group_id)) ERR_NOT_TIME_YET)

        (asserts! 
          (is-eq (get payout_position member-data) current_cycle)
          ERR_NOT_YOUR_TURN
        )
        (asserts! 
          (not (get has_received_payout member-data))
          ERR_ALREADY_RECEIVED_PAYOUT
        )
        (asserts! 
          (>= (get total_pool_balance group-data) payout_amount)
          ERR_INSUFFICIENT_CONTRIBUTIONS
        )

        ;; Transfer payout FROM contract TO member
        (try! 
          (as-contract (stx-transfer? payout_amount tx-sender recipient))
        )

        ;; Mark member as paid
        (map-set group_members
          { group_id: group_id, member_address: tx-sender }
          (merge member-data { has_received_payout: true })
        )

        ;; Update group state
        (let
          (
            (new_balance (- (get total_pool_balance group-data) payout_amount))
            (next_cycle (+ current_cycle u1))
            (effective-max (get-effective-max-members (get max_members group-data)))
            (is_completed (> next_cycle effective-max))
          )
          (map-set groups
            { group_id: group_id }
            (merge group-data
              {
                total_pool_balance: new_balance,
                current_cycle: (if is_completed current_cycle next_cycle),
                status: (if is_completed STATUS_COMPLETED STATUS_ACTIVE)
              }
            )
          )
        )

        (ok true)
      )
      ERR_NOT_MEMBER
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Open withdrawal window after all cycles complete (Model 2)
(define-public (open-withdrawal-window (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (let
      (
        (effective-max (get-effective-max-members (get max_members group-data)))
      )
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-eq (get group_mode group-data) MODE_COLLECTIVE_SAVINGS) ERR_INVALID_MODE)
      (asserts! (is-eq (get status group-data) STATUS_ACTIVE) ERR_GROUP_COMPLETED)
      (asserts! 
        (>= (get current_cycle group-data) effective-max)
        ERR_NOT_ALL_CYCLES_COMPLETE
      )

      ;; Open withdrawal window
      (map-set groups
        { group_id: group_id }
        (merge group-data { status: STATUS_WITHDRAWAL_OPEN })
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Member withdraws their total contributions (Model 2)
(define-public (withdraw-savings (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (match (map-get? group_members { group_id: group_id, member_address: tx-sender })
      member-data
      (let
        (
          (withdrawal_amount (get total_contributed member-data))
          (recipient tx-sender)
        )
        ;; Validations
        (asserts! (is-eq (get group_mode group-data) MODE_COLLECTIVE_SAVINGS) ERR_INVALID_MODE)
        (asserts! (is-eq (get status group-data) STATUS_WITHDRAWAL_OPEN) ERR_WITHDRAWAL_NOT_AVAILABLE)
        (asserts! (not (get has_withdrawn member-data)) ERR_ALREADY_WITHDRAWN)
        (asserts! (> withdrawal_amount u0) ERR_NO_BALANCE)
        (asserts! (>= (get total_pool_balance group-data) withdrawal_amount) ERR_INSUFFICIENT_CONTRIBUTIONS)

        ;; Transfer savings FROM contract TO member
        (try! 
          (as-contract (stx-transfer? withdrawal_amount tx-sender recipient))
        )

        ;; Mark member as withdrawn
        (map-set group_members
          { group_id: group_id, member_address: tx-sender }
          (merge member-data { has_withdrawn: true })
        )

        ;; Update pool balance
        (map-set groups
          { group_id: group_id }
          (merge group-data
            {
              total_pool_balance: (- (get total_pool_balance group-data) withdrawal_amount)
            }
          )
        )

        (ok true)
      )
      ERR_NOT_MEMBER
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS - Discovery & Queries
;; ============================================================================

;; NEW: Get total count of public groups
(define-read-only (get-public-group-count)
  (ok (var-get public-group-count))
)

;; NEW: Get public group by index
(define-read-only (get-public-group-by-index (index uint))
  (match (map-get? public_group_index index)
    group_id (map-get? groups { group_id: group_id })
    none
  )
)

;; NEW: Check if group is accepting new members
(define-read-only (can-join-group (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (ok {
      is_public: (is-eq (get group_type group-data) GROUP_TYPE_PUBLIC),
      enrollment_open: (is-enrollment-open group_id),
      is_full: (is-group-full group_id),
      current_members: (get members_count group-data),
      max_members: (get-effective-max-members (get max_members group-data)),
      enrollment_end_block: (get enrollment_end_block group-data),
      can_join: (and
        (is-eq (get group_type group-data) GROUP_TYPE_PUBLIC)
        (is-enrollment-open group_id)
        (not (is-group-full group_id))
      )
    })
    ERR_GROUP_NOT_FOUND
  )
)

;; Existing read-only functions from V2
(define-read-only (get-group (group_id (string-utf8 50)))
  (map-get? groups { group_id: group_id })
)

(define-read-only (get-member 
  (group_id (string-utf8 50))
  (member_address principal)
)
  (map-get? group_members { group_id: group_id, member_address: member_address })
)

(define-read-only (get-contribution
  (group_id (string-utf8 50))
  (member_address principal)
  (cycle uint)
)
  (map-get? contributions { group_id: group_id, member_address: member_address, cycle: cycle })
)

(define-read-only (check-payment-window (group_id (string-utf8 50)))
  (let
    (
      (cycle_deadline (get-current-cycle-deadline group_id))
      (grace_deadline (get-grace-period-deadline group_id))
    )
    {
      current_block: stacks-block-height,
      cycle_deadline: cycle_deadline,
      grace_deadline: grace_deadline,
      is_within_cycle: (<= stacks-block-height cycle_deadline),
      is_within_grace: (and 
        (> stacks-block-height cycle_deadline)
        (<= stacks-block-height grace_deadline)
      ),
      is_expired: (> stacks-block-height grace_deadline)
    }
  )
)

;; ============================================================================
;; MODE CHANGE VOTING
;; ============================================================================

;; Creator proposes mode change (can only happen between cycles)
(define-public (propose-mode-change
  (group_id (string-utf8 50))
  (new_mode uint)
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-valid-mode new_mode) ERR_INVALID_MODE)
      (asserts! (is-none (get pending_mode_change group-data)) ERR_MODE_CHANGE_PENDING)
      (asserts! 
        (is-eq (get status group-data) STATUS_ACTIVE)
        ERR_CYCLE_IN_PROGRESS
      )

      ;; Set pending mode change
      (map-set groups
        { group_id: group_id }
        (merge group-data
          {
            pending_mode_change: (some new_mode),
            mode_change_votes_for: u0,
            mode_change_votes_against: u0
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Member votes on proposed mode change
(define-public (vote-on-mode-change
  (group_id (string-utf8 50))
  (vote_for bool)
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (match (map-get? group_members { group_id: group_id, member_address: tx-sender })
      member-data
      (begin
        ;; Validations
        (asserts! (is-some (get pending_mode_change group-data)) ERR_GROUP_NOT_FOUND)
        (asserts! (not (get voted_on_mode_change member-data)) ERR_ALREADY_VOTED)

        ;; Record vote
        (map-set group_members
          { group_id: group_id, member_address: tx-sender }
          (merge member-data
            {
              voted_on_mode_change: true,
              vote_for_mode_change: vote_for
            }
          )
        )

        ;; Update vote counts
        (map-set groups
          { group_id: group_id }
          (merge group-data
            {
              mode_change_votes_for: (if vote_for 
                (+ (get mode_change_votes_for group-data) u1)
                (get mode_change_votes_for group-data)
              ),
              mode_change_votes_against: (if vote_for
                (get mode_change_votes_against group-data)
                (+ (get mode_change_votes_against group-data) u1)
              )
            }
          )
        )

        ;; Check if all members voted and approve if unanimous
        (if (all-members-voted group_id)
          (if (mode-change-approved group_id)
            ;; All voted YES - apply mode change
            (let
              (
                (updated-data (unwrap-panic (map-get? groups { group_id: group_id })))
              )
              (map-set groups
                { group_id: group_id }
                (merge updated-data
                  {
                    group_mode: (unwrap-panic (get pending_mode_change updated-data)),
                    pending_mode_change: none,
                    mode_change_votes_for: u0,
                    mode_change_votes_against: u0
                  }
                )
              )
              (ok true)
            )
            ;; Not unanimous - reject mode change
            (let
              (
                (updated-data (unwrap-panic (map-get? groups { group_id: group_id })))
              )
              (map-set groups
                { group_id: group_id }
                (merge updated-data
                  {
                    pending_mode_change: none,
                    mode_change_votes_for: u0,
                    mode_change_votes_against: u0
                  }
                )
              )
              (ok false)
            )
          )
          (ok true)
        )
      )
      ERR_NOT_MEMBER
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Cancel pending mode change (creator only)
(define-public (cancel-mode-change (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-some (get pending_mode_change group-data)) ERR_GROUP_NOT_FOUND)

      ;; Cancel mode change
      (map-set groups
        { group_id: group_id }
        (merge group-data
          {
            pending_mode_change: none,
            mode_change_votes_for: u0,
            mode_change_votes_against: u0
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; CREATOR OVERRIDE (Dispute Resolution)
;; ============================================================================

;; Creator manually marks a contribution as paid
(define-public (creator-mark-paid
  (group_id (string-utf8 50))
  (member_address principal)
  (cycle uint)
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)
      (asserts! (is-member group_id member_address) ERR_NOT_MEMBER)

      ;; Mark as paid
      (map-set contributions
        { group_id: group_id, member_address: member_address, cycle: cycle }
        {
          amount: (get deposit_per_member group-data),
          paid_at_block: stacks-block-height,
          is_paid: true
        }
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Creator pauses/unpauses group
(define-public (creator-set-status
  (group_id (string-utf8 50))
  (new_status uint)
)
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)

      ;; Update status
      (map-set groups
        { group_id: group_id }
        (merge group-data { status: new_status })
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; Creator advances to next cycle manually
(define-public (creator-advance-cycle (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (begin
      ;; Validations
      (asserts! (is-creator group_id tx-sender) ERR_AUTH)

      ;; Advance cycle
      (map-set groups
        { group_id: group_id }
        (merge group-data 
          { 
            current_cycle: (+ (get current_cycle group-data) u1),
            cycle_start_block: stacks-block-height
          }
        )
      )

      (ok true)
    )
    ERR_GROUP_NOT_FOUND
  )
)

;; ============================================================================
;; ADDITIONAL READ-ONLY FUNCTIONS
;; ============================================================================

(define-read-only (get-mode-change-status (group_id (string-utf8 50)))
  (match (map-get? groups { group_id: group_id })
    group-data
    (ok {
      pending_mode: (get pending_mode_change group-data),
      votes_for: (get mode_change_votes_for group-data),
      votes_against: (get mode_change_votes_against group-data),
      total_members: (get members_count group-data),
      all_voted: (all-members-voted group_id),
      approved: (mode-change-approved group_id)
    })
    ERR_GROUP_NOT_FOUND
  )
)

(define-read-only (get-member-vote-status
  (group_id (string-utf8 50))
  (member_address principal)
)
  (match (map-get? group_members { group_id: group_id, member_address: member_address })
    member-data
    (ok {
      has_voted: (get voted_on_mode_change member-data),
      vote: (get vote_for_mode_change member-data)
    })
    ERR_NOT_MEMBER
  )
)
