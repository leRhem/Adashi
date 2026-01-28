export const ERROR_CODES = {
  // Authorization & Membership
  300: {
    code: 'ERR_AUTH',
    message: 'Unauthorized',
    userMessage: "You don't have permission to perform this action. Only the group creator can do this.",
    action: 'contact_creator'
  },
  307: {
    code: 'ERR_ALREADY_MEMBER',
    message: 'Already a member',
    userMessage: "You're already a member of this group!",
    action: 'view_group'
  },
  308: {
    code: 'ERR_NOT_MEMBER',
    message: 'Not a member',
    userMessage: "You need to join this group first before you can perform this action.",
    action: 'join_group'
  },

  // Payouts & Timing
  301: {
    code: 'ERR_NOT_YOUR_TURN',
    message: 'Not your turn',
    userMessage: "It's not your turn yet. You're in position {position}, currently on cycle {currentCycle}.",
    action: 'wait'
  },
  310: {
    code: 'ERR_NOT_TIME_YET',
    message: 'Not time yet',
    userMessage: "The cycle hasn't started yet. Please wait for the enrollment period to close.",
    action: 'wait_enrollment'
  },
  311: {
    code: 'ERR_GRACE_PERIOD_ENDED',
    message: 'Grace period ended',
    userMessage: "The grace period for this cycle has ended. You missed the deposit window.",
    action: 'contact_creator'
  },
  314: {
    code: 'ERR_ALREADY_RECEIVED_PAYOUT',
    message: 'Already received payout',
    userMessage: "You've already received your payout for this group.",
    action: 'none'
  },

  // Deposits & Balance
  302: {
    code: 'ERR_TRANSFER_FAILED',
    message: 'Transfer failed',
    userMessage: "The STX transfer failed. Please check your wallet balance and try again.",
    action: 'check_balance'
  },
  303: {
    code: 'ERR_NO_BALANCE',
    message: 'Insufficient balance',
    userMessage: "You don't have enough STX to complete this transaction.",
    action: 'add_funds'
  },
  309: {
    code: 'ERR_ALREADY_PAID',
    message: 'Already paid',
    userMessage: "You've already deposited for this cycle.",
    action: 'view_contribution'
  },
  312: {
    code: 'ERR_INSUFFICIENT_CONTRIBUTIONS',
    message: 'Insufficient contributions',
    userMessage: "Not enough contributions in the pool yet. Wait for more members to deposit.",
    action: 'wait'
  },

  // Group Setup
  304: {
    code: 'ERR_EMPTY_NAME',
    message: 'Empty name',
    userMessage: "Please provide a name for the group or member.",
    action: 'retry'
  },
  305: {
    code: 'ERR_MAX_MEMBERS',
    message: 'Max members reached',
    userMessage: "This group is full. Maximum {maxMembers} members allowed.",
    action: 'find_another_group'
  },
  306: {
    code: 'ERR_GROUP_NOT_FOUND',
    message: 'Group not found',
    userMessage: "This group doesn't exist or has been deleted.",
    action: 'browse_groups'
  },
  313: {
    code: 'ERR_INVALID_PAYOUT_POSITION',
    message: 'Invalid payout position',
    userMessage: "The assigned payout position is invalid. It must be between 1 and {maxMembers}.",
    action: 'contact_creator'
  },
  315: {
    code: 'ERR_GROUP_COMPLETED',
    message: 'Group completed',
    userMessage: "This group has completed all its cycles.",
    action: 'view_history'
  },

  // Mode Changes
  316: {
    code: 'ERR_INVALID_MODE',
    message: 'Invalid mode',
    userMessage: "The selected group mode is invalid. Choose from ROSCA, Collective Savings, or Interest-Bearing.",
    action: 'retry'
  },
  317: {
    code: 'ERR_MODE_CHANGE_PENDING',
    message: 'Mode change pending',
    userMessage: "There's already a mode change vote in progress. Wait for it to complete.",
    action: 'view_vote'
  },
  318: {
    code: 'ERR_ALREADY_VOTED',
    message: 'Already voted',
    userMessage: "You've already voted on this mode change proposal.",
    action: 'wait_results'
  },

  // Withdrawals (Model 2)
  319: {
    code: 'ERR_NOT_ALL_CYCLES_COMPLETE',
    message: 'Cycles not complete',
    userMessage: "All {maxCycles} cycles must complete before the withdrawal window opens.",
    action: 'wait'
  },
  320: {
    code: 'ERR_WITHDRAWAL_NOT_AVAILABLE',
    message: 'Withdrawal not available',
    userMessage: "The withdrawal window is not open yet. Wait for all cycles to complete.",
    action: 'wait'
  },
  321: {
    code: 'ERR_ALREADY_WITHDRAWN',
    message: 'Already withdrawn',
    userMessage: "You've already withdrawn your savings from this group.",
    action: 'none'
  },

  // Public Groups
  322: {
    code: 'ERR_CYCLE_IN_PROGRESS',
    message: 'Cycle in progress',
    userMessage: "Cannot make this change while a cycle is in progress. Wait for it to complete.",
    action: 'wait'
  },
  323: {
    code: 'ERR_ENROLLMENT_CLOSED',
    message: 'Enrollment closed',
    userMessage: "This group's enrollment period has ended. You can't join anymore.",
    action: 'find_another_group'
  },
  324: {
    code: 'ERR_INVALID_GROUP_TYPE',
    message: 'Invalid group type',
    userMessage: "This operation is not allowed for this type of group (public vs private).",
    action: 'none'
  },
  325: {
    code: 'ERR_GROUP_NOT_PUBLIC',
    message: 'Group not public',
    userMessage: "This is a private group. You need an invitation from the creator to join.",
    action: 'contact_creator'
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
