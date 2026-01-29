import { 
  Cl,
  fetchCallReadOnlyFunction,
  cvToHex,
  hexToCV,
  PostConditionMode,
  Pc,
  type PostCondition,
  type ClarityValue,
  ClarityType
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { openContractCall as connectOpenContractCall } from '@stacks/connect';
import { useToast } from '../context/ToastContext';
import { useStacksConnect } from './useStacksConnect';

// HELPER: Convert Clarity Value to JS Value
function cvToValue(val: ClarityValue): any {
  if (!val) return null;
  const v = val as any;
  switch (v.type) {
    case ClarityType.Int:
    case ClarityType.UInt:
      return Number(v.value);
    case ClarityType.Buffer:
      // BufferCV value is a string (hex?) or maybe bytes. 
      // types.d.ts says string. It's likely a hex string or raw string.
      // If it's a hex string representing text, we might need to decode it.
      // But usually in Clarity JS SDK v7, value IS the string/content.
      return v.value; 
    case ClarityType.BoolTrue:
      return true;
    case ClarityType.BoolFalse:
      return false;
    case ClarityType.PrincipalStandard:
    case ClarityType.PrincipalContract:
      // PrincipalCV has .value (string)
      return v.value;
    case ClarityType.ResponseOk:
      return cvToValue(v.value);
    case ClarityType.ResponseErr:
      return cvToValue(v.value);
    case ClarityType.OptionalNone:
      return null;
    case ClarityType.OptionalSome:
      return cvToValue(v.value);
    case ClarityType.List:
      // ListCV has .value (array)
      return v.value.map(cvToValue);
    case ClarityType.Tuple:
      // TupleCV has .value (object key->value)
      const result: Record<string, any> = {};
      Object.entries(v.value).forEach(([key, value]) => {
        result[key] = cvToValue(value as ClarityValue);
      });
      return result;
    case ClarityType.StringASCII:
    case ClarityType.StringUTF8:
      // StringCV has .value (string)
      return v.value;
    default:
      return v && typeof v === 'object' && 'value' in v ? v.value : v;
  }
}

// =============================================================================
// CONTRACT CONFIGURATION
// =============================================================================
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME;
const network = STACKS_TESTNET;

// =============================================================================
// CONSTANTS - Group Modes & Types (matching contract)
// =============================================================================
export const MODE_TRADITIONAL_ROSCA = 1;
export const MODE_COLLECTIVE_SAVINGS = 2;
export const MODE_INTEREST_BEARING = 3;

export const GROUP_TYPE_PRIVATE = 1;
export const GROUP_TYPE_PUBLIC = 2;

export const STATUS_ENROLLMENT = 0;
export const STATUS_ACTIVE = 1;
export const STATUS_COMPLETED = 2;
export const STATUS_PAUSED = 3;
export const STATUS_WITHDRAWAL_OPEN = 4;

// =============================================================================
// TYPES
// =============================================================================
export interface GroupData {
  creator: string;
  name: string;
  description: string | null;
  depositPerMember: number;
  cycleDurationBlocks: number;
  maxMembers: number;
  membersCount: number;
  currentCycle: number;
  cycleStartBlock: number;
  status: number;
  totalPoolBalance: number;
  createdAt: number;
  groupMode: number;
  pendingModeChange: number | null;
  modeChangeVotesFor: number;
  modeChangeVotesAgainst: number;
  groupType: number;
  enrollmentPeriodBlocks: number;
  enrollmentEndBlock: number;
  autoStartWhenFull: boolean;
  isPublicListed: boolean;
  groupId?: string;
}

export interface MemberData {
  memberName: string;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  joinedAt: number;
  totalContributed: number;
  hasWithdrawn: boolean;
  votedOnModeChange: boolean;
  voteForModeChange: boolean;
}

export interface ContributionData {
  amount: number;
  paidAtBlock: number;
  isPaid: boolean;
}

// =============================================================================
// HOOK
// =============================================================================
export function useContract() {
  const { userSession, userAddress } = useStacksConnect();
  const showToast = useToast();
  
  // Use Stacks Connect to open the transaction dialog
  const openContractCall = connectOpenContractCall;

  // Helper to extract the actual value from Clarity response
  const extractValue = (result: any): any => {
    if (result === null || result === undefined) return null;
    
    // If it's a primitive, return directly
    if (typeof result !== 'object') return result;
    
    // Handle arrays
    if (Array.isArray(result)) {
      return result.map(extractValue);
    }
    
    // Check if this is a Clarity value object (has 'type' property)
    if ('type' in result) {
      const type = result.type;
      
      // Handle optional none
      if (type === 'none') {
        return null;
      }
      
      // Handle optional some - recursively extract the inner value
      if (type === 'some' && 'value' in result) {
        return extractValue(result.value);
      }
      
      // Handle primitive types with 'value' property
      if ('value' in result) {
        const val = result.value;
        
        // If the value is an object (like a tuple), recursively extract
        if (typeof val === 'object' && val !== null) {
          return extractValue(val);
        }
        
        // For uint, int types - convert to number
        if (type === 'uint' || type === 'int' || type.startsWith('uint') || type.startsWith('int')) {
          return Number(val);
        }
        
        // For string types, return as-is
        if (type.includes('string') || type === 'principal') {
          return String(val);
        }
        
        // For bool
        if (type === 'bool') {
          return Boolean(val);
        }
        
        // For other types with value, just return the value
        return val;
      }
    }
    
    // For objects/tuples without 'type', recursively extract values from all properties
    const extracted: any = {};
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        extracted[key] = extractValue(result[key]);
      }
    }
    return extracted;
  };

  // Helper to make read-only calls
  const callReadOnly = async (
    functionName: string,
    functionArgs: ClarityValue[] = []
  ) => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        network,
        senderAddress: userAddress || CONTRACT_ADDRESS,
      });
      const converted = cvToValue(result);
      console.log(`Raw result for ${functionName}:`, converted);
      return extractValue(converted);
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      return null;
    }
  };

  // Helper to make contract calls
  const callContract = async (
    functionName: string,
    functionArgs: ClarityValue[],
    onFinish: (data: any) => void,
    onCancel?: () => void,
    postConditions: PostCondition[] = [],
    postConditionMode: PostConditionMode = PostConditionMode.Allow
  ) => {
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs,
      network,
      userSession,
      onFinish,
      onCancel,
      postConditions,
      postConditionMode,
      appDetails: {
        name: 'Adashi',
        icon: window.location.origin + '/Logo.png',
      },
    };
    
    await openContractCall(txOptions as any);
  };

  // ===========================================================================
  // READ-ONLY FUNCTIONS
  // ===========================================================================

  /**
   * Get total count of public groups
   */
  const getPublicGroupCount = async (): Promise<number> => {
    const result = await callReadOnly('get-public-group-count');
    return result ?? 0;
  };

  /**
   * Get a public group's ID by its index (reads from public_group_index map)
   * Uses Stacks API map_entry endpoint to read the map directly
   */
  const getPublicGroupIdByIndex = async (index: number): Promise<string | null> => {
    try {
      // Use Stacks API URL from env
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.testnet.hiro.so';
      const url = `${apiUrl}/v2/map_entry/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/public_group_index`;
      
      // Create the key as a Clarity uint
      const key = Cl.uint(index);
      const serializedKey = cvToHex(key);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializedKey)
      });
      
      if (!response.ok) {
        console.error('Failed to read map entry:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      if (data.data) {
        // Parse the hex response back to a Clarity value
        const cv = hexToCV(data.data);
        const value = cvToValue(cv);
        return extractValue(value);
      }
      return null;
    } catch (error) {
      console.error('Error reading map entry:', error);
      return null;
    }
  };

  /**
   * Get a public group's data by its index
   * Note: This returns the full group data with the groupId included
   */
  const getPublicGroupByIndex = async (index: number): Promise<(GroupData & { groupId: string }) | null> => {
    const result = await callReadOnly('get-public-group-by-index', [Cl.uint(index)]);
    if (!result) return null;
    
    // Also fetch the group ID from the map
    const groupId = await getPublicGroupIdByIndex(index);
    
    // Map Clarity response to TypeScript interface
    return {
      groupId: groupId || `group_${index}`, // Fallback if ID fetch fails
      creator: result.creator,
      name: result.name,
      description: result.description ?? null,
      depositPerMember: Number(result.deposit_per_member || 0),
      cycleDurationBlocks: Number(result.cycle_duration_blocks || 0),
      maxMembers: Number(result.max_members || 0),
      membersCount: Number(result.members_count || 0),
      currentCycle: Number(result.current_cycle || 0),
      cycleStartBlock: Number(result.cycle_start_block || 0),
      status: Number(result.status || 0),
      totalPoolBalance: Number(result.total_pool_balance || 0),
      createdAt: Number(result.created_at || 0),
      groupMode: Number(result.group_mode || 1),
      pendingModeChange: result.pending_mode_change ?? null,
      modeChangeVotesFor: Number(result.mode_change_votes_for || 0),
      modeChangeVotesAgainst: Number(result.mode_change_votes_against || 0),
      groupType: Number(result.group_type || 1),
      enrollmentPeriodBlocks: Number(result.enrollment_period_blocks || 0),
      enrollmentEndBlock: Number(result.enrollment_end_block || 0),
      autoStartWhenFull: Boolean(result.auto_start_when_full),
      isPublicListed: Boolean(result.is_public_listed),
    };
  };

  /**
   * Get group details by ID
   */
  const getGroup = async (groupId: string): Promise<GroupData | null> => {
    const result = await callReadOnly('get-group', [Cl.stringUtf8(groupId)]);
    if (!result) return null;
    
    // Map Clarity response to TypeScript interface
    return {
      creator: result.creator,
      name: result.name,
      description: result.description ?? null,
      depositPerMember: Number(result['deposit-per-member'] ?? result.deposit_per_member ?? result.depositPerMember ?? 0),
      cycleDurationBlocks: Number(result['cycle-duration-blocks'] ?? result.cycle_duration_blocks ?? result.cycleDurationBlocks ?? 0),
      maxMembers: Number(result['max-members'] ?? result.max_members ?? result.maxMembers ?? 0),
      membersCount: Number(result['members-count'] ?? result.members_count ?? result.membersCount ?? 0),
      currentCycle: Number(result['current-cycle'] ?? result.current_cycle ?? result.currentCycle ?? 0),
      cycleStartBlock: Number(result['cycle-start-block'] ?? result.cycle_start_block ?? result.cycleStartBlock ?? 0),
      status: Number(result.status),
      totalPoolBalance: Number(result['total-pool-balance'] ?? result.total_pool_balance ?? result.totalPoolBalance ?? 0),
      createdAt: Number(result['created-at'] ?? result.created_at ?? result.createdAt ?? 0),
      groupMode: Number(result['group-mode'] ?? result.group_mode ?? result.groupMode ?? 1),
      pendingModeChange: result['pending-mode-change'] ?? result.pendingModeChange ?? null,
      modeChangeVotesFor: Number(result['mode-change-votes-for'] ?? result.modeChangeVotesFor ?? 0),
      modeChangeVotesAgainst: Number(result['mode-change-votes-against'] ?? result.modeChangeVotesAgainst ?? 0),
      groupType: Number(result['group-type'] ?? result.group_type ?? result.groupType ?? 1),
      enrollmentPeriodBlocks: Number(result['enrollment-period-blocks'] ?? result.enrollment_period_blocks ?? 0),
      enrollmentEndBlock: Number(result['enrollment-end-block'] ?? result.enrollment_end_block ?? 0),
      autoStartWhenFull: Boolean(result['auto-start-when-full'] ?? result.auto_start_when_full ?? result.autoStartWhenFull ?? false),
      isPublicListed: Boolean(result['is-public-listed'] ?? result.is_public_listed ?? result.isPublicListed ?? false),
    };
  };

  /**
   * Get member data within a group
   */
  const getGroupMember = async (groupId: string, memberAddress: string): Promise<MemberData | null> => {
    const result = await callReadOnly('get-member', [
      Cl.stringUtf8(groupId),
      Cl.principal(memberAddress)
    ]);
    if (!result) return null;

    return {
      memberName: result['member-name'] || result.member_name || result.memberName,
      payoutPosition: Number(result['payout-position'] || result.payout_position || result.payoutPosition),
      hasReceivedPayout: Boolean(result['has-received-payout'] || result.has_received_payout || result.hasReceivedPayout),
      joinedAt: Number(result['joined-at'] || result.joined_at || result.joinedAt),
      totalContributed: Number(result['total-contributed'] || result.total_contributed || result.totalContributed || 0),
      hasWithdrawn: Boolean(result['has-withdrawn'] || result.has_withdrawn || result.hasWithdrawn),
      votedOnModeChange: Boolean(result['voted-on-mode-change'] || result.voted_on_mode_change || result.votedOnModeChange),
      voteForModeChange: Boolean(result['vote-for-mode-change'] || result.vote_for_mode_change || result.voteForModeChange),
    };
  };

  /**
   * Get contribution status for a member in a specific cycle
   */
  const getContribution = async (
    groupId: string, 
    memberAddress: string, 
    cycle: number
  ): Promise<ContributionData | null> => {
    const result = await callReadOnly('get-contribution', [
      Cl.stringUtf8(groupId),
      Cl.principal(memberAddress),
      Cl.uint(cycle)
    ]);
    if (!result) return null;

    return {
      amount: Number(result.amount),
      paidAtBlock: Number(result['paid-at-block'] || result.paid_at_block || result.paidAtBlock),
      isPaid: Boolean(result['is-paid'] || result.is_paid || result.isPaid),
    };
  };

  /**
   * Get mode change status (Governance)
   */
  const getModeChangeStatus = async (groupId: string) => {
    const result = await callReadOnly('get-mode-change-status', [Cl.stringUtf8(groupId)]);
    if (!result) return null;
    return {
      pendingMode: result['pending-mode'] ?? result.pending_mode ?? (result.pendingMode ? result.pendingMode.value : null),
      votesFor: Number(result['votes-for'] ?? result.votes_for ?? result.votesFor ?? 0),
      votesAgainst: Number(result['votes-against'] ?? result.votes_against ?? result.votesAgainst ?? 0),
      totalMembers: Number(result['total-members'] ?? result.total_members ?? result.totalMembers ?? 0),
      allVoted: Boolean(result['all-voted'] ?? result.all_voted ?? result.allVoted ?? false),
      approved: Boolean(result.approved ?? false)
    };
  };

  /**
   * Get member vote status
   */
  const getMemberVoteStatus = async (groupId: string, memberAddress: string) => {
    const result = await callReadOnly('get-member-vote-status', [
      Cl.stringUtf8(groupId), 
      Cl.principal(memberAddress)
    ]);
    if (!result) return null;
    return {
      hasVoted: Boolean(result['has-voted'] ?? result.has_voted ?? result.hasVoted ?? false),
      vote: Boolean(result.vote ?? false)
    };
  };

  // ===========================================================================
  // WRITE FUNCTIONS
  // ===========================================================================

  /**
   * Create a new public group
   */
  const createPublicGroup = async (
    groupId: string,
    name: string,
    description: string | null,
    depositPerMember: number,
    cycleDurationBlocks: number,
    maxMembers: number,
    groupMode: number,
    enrollmentPeriodBlocks: number,
    autoStartWhenFull: boolean,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'create-public-group',
      [
        Cl.stringUtf8(groupId),
        Cl.stringUtf8(name),
        description ? Cl.some(Cl.stringUtf8(description)) : Cl.none(),
        Cl.uint(depositPerMember),
        Cl.uint(cycleDurationBlocks),
        Cl.uint(maxMembers),
        Cl.uint(groupMode),
        Cl.uint(enrollmentPeriodBlocks),
        Cl.bool(autoStartWhenFull)
      ],
      onFinish,
      onCancel
    );
  };

  /**
   * Create a new private group
   */
  const createPrivateGroup = async (
    groupId: string,
    name: string,
    description: string | null,
    depositPerMember: number,
    cycleDurationBlocks: number,
    maxMembers: number,
    groupMode: number,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'create-private-group',
      [
        Cl.stringUtf8(groupId),
        Cl.stringUtf8(name),
        description ? Cl.some(Cl.stringUtf8(description)) : Cl.none(),
        Cl.uint(depositPerMember),
        Cl.uint(cycleDurationBlocks),
        Cl.uint(maxMembers),
        Cl.uint(groupMode)
      ],
      onFinish,
      onCancel
    );
  };

  /**
   * Join a public group
   */
  const joinPublicGroup = async (
    groupId: string,
    memberName: string,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'join-public-group',
      [
        Cl.stringUtf8(groupId),
        Cl.stringUtf8(memberName)
      ],
      onFinish,
      onCancel
    );
  };

  /**
   * Deposit to current cycle
   */
  const deposit = async (
    groupId: string,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    if (!userAddress) return;
    
    // Fetch group to get precise deposit amount
    const group = await getGroup(groupId);
    if (!group) {
        console.error('Group not found for deposit post-condition');
        return;
    }
    
    if (group.depositPerMember === 0) {
        console.warn('WARN: Deposit amount is 0, might cause transaction issues if contract requires payment.');
        showToast({
          type: 'warning',
          title: 'Zero Deposit Detected',
          message: 'The system detected a 0 STX deposit requirement. If this is incorrect, the transaction may fail.',
        });
    }

    const postConditions = [
        Pc.principal(userAddress)
          .willSendEq(group.depositPerMember)
          .ustx()
    ];

    await callContract(
      'deposit',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel,
      postConditions,
      PostConditionMode.Deny
    );
  };

  /**
   * Claim payout (for ROSCA mode)
   */
  const claimPayout = async (
    groupId: string,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    // Fetch group to calculate payout amount
    const group = await getGroup(groupId);
    if (!group) {
       console.error('Failed to fetch group for Payout Amount calculation');
       return;
    }

    // Total Pot = members * deposit per member
    const payoutAmount = group.membersCount * group.depositPerMember;
    
    console.log('DEBUG: Claim Payout Check', { 
        members: group.membersCount, 
        deposit: group.depositPerMember, 
        total: payoutAmount,
        rawGroup: group 
    });

    // Check if it's the user's turn
    const member = await getGroupMember(groupId, userAddress);
    if (!member) {
        console.error('Member data not found for Payout validation');
        return;
    }

    if (group.currentCycle !== member.payoutPosition) {
        showToast({
            type: 'error',
            title: 'Not Your Turn',
            message: `You can only claim payout in Cycle #${member.payoutPosition}. Current Cycle is #${group.currentCycle}.`,
        });
        if (onCancel) onCancel();
        return;
    }

    if (payoutAmount === 0) {
        console.error('CRITICAL: Calculated Payout Amount is 0. Aborting to prevent Post-Condition failure.');
        showToast({
            type: 'error',
            title: 'Payout Calculation Failed',
            message: 'Unable to calculate payout amount (0). Please verify group data.',
            action: { label: 'Retry', onClick: () => window.location.reload() }
        });
        if (onCancel) onCancel();
        return;
    }



    // Check Block Height (Time)
    // We assume access to current block height. If not standard, we skip or fetch it.
    // For now, let's try to be smart about it or just rely on contract error if we can't easily get height.
    // BUT since we want to prevent the "Allowed" feeling, let's fetch it.
    try {
        let apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
            if (import.meta.env.PROD) {
                throw new Error('CRITICAL: VITE_API_URL is missing in production environment. Cannot default to testnet.');
            } else {
                console.warn('VITE_API_URL missing, falling back to testnet API: https://api.testnet.hiro.so');
                apiUrl = 'https://api.testnet.hiro.so';
            }
        }
        const infoUrl = `${apiUrl}/v2/info`;
        const infoRes = await fetch(infoUrl);
        const infoData = await infoRes.json();
        const currentBlockHeight = infoData.stacks_tip_height;

        const cycleDeadline = group.cycleStartBlock + group.cycleDurationBlocks;
        
        if (currentBlockHeight < cycleDeadline) {
             const blocksRemaining = cycleDeadline - currentBlockHeight;
             const minutesRemaining = blocksRemaining * 10;
             const days = Math.floor(minutesRemaining / 1440);
             const hours = Math.floor((minutesRemaining % 1440) / 60);

             let timeString = '';
             if (days > 0) timeString += `${days} days `;
             if (hours > 0) timeString += `${hours} hours`;
             if (timeString === '') timeString = 'less than 1 hour';

             showToast({
                type: 'error',
                title: 'Cycle Not Ended',
                message: `You must wait for the cycle to complete. Remaining time: ~${timeString} (${blocksRemaining} blocks).`,
            });
            if (onCancel) onCancel();
            return;
        }
    } catch (err) {
        console.warn('Could not fetch block height for validation, proceeding with contract check:', err);
    }

    const postConditions = [
        Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendEq(payoutAmount)
          .ustx()
    ];

    await callContract(
      'claim-payout',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel,
      postConditions,
      PostConditionMode.Deny
    );
  };

  /**
   * Withdraw savings (for Collective Savings mode)
   */
  const withdrawSavings = async (
    groupId: string,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    if (!userAddress) return;

    // Fetch member data to get total contributed
    const member = await getGroupMember(groupId, userAddress);
    if (!member) {
        console.error('Member data not found for withdrawal post-condition');
        return;
    }

    console.log('DEBUG: Withdrawal Check', { totalContributed: member.totalContributed });
    
    // Check Status
    const group = await getGroup(groupId);
    if (!group) return;

    if (group.status !== STATUS_WITHDRAWAL_OPEN) {
        showToast({
            type: 'error',
            title: 'Withdrawal Not Active',
            message: 'You can only withdraw savings after the group cycle is completed and withdrawal is opened.',
        });
        if (onCancel) onCancel();
        return;
    }
    
    if (member.totalContributed === 0) {
        console.warn('WARN: Withdrawal amount is 0.');
        showToast({
            type: 'warning',
            title: 'Empty Withdrawal',
            message: 'You have no contributions to withdraw.',
        });
        // We might want to allow it if the contract cleans up state? But usually not useful.
        // Returning to be safe.
        if (onCancel) onCancel();
        return;
    }

    const postConditions = [
        Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendEq(member.totalContributed)
          .ustx()
    ];

    await callContract(
      'withdraw-savings',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel,
      postConditions,
      PostConditionMode.Deny
    );
  };

  /**
   * Open enrollment period (creator only)
   */
  const openEnrollmentPeriod = async (
    groupId: string,
    enrollmentPeriodBlocks: number,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'open-enrollment-period',
      [
        Cl.stringUtf8(groupId),
        Cl.uint(enrollmentPeriodBlocks)
      ],
      onFinish,
      onCancel
    );
  };

  /**
   * Close enrollment and start cycle (creator only)
   */
  const closeEnrollmentAndStart = async (
    groupId: string,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'close-enrollment-and-start',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel
    );
  };

  /**
   * Add member to private group (creator only)
   */
  const addMember = async (
    groupId: string,
    memberAddress: string,
    memberName: string,
    payoutPosition: number,
    onFinish: (data: any) => void,
    onCancel?: () => void
  ) => {
    await callContract(
      'add-member',
      [
        Cl.stringUtf8(groupId),
        Cl.principal(memberAddress),
        Cl.stringUtf8(memberName),
        Cl.uint(payoutPosition)
      ],
      onFinish,
      onCancel
    );
  };

  return { 
    // Read functions
    getPublicGroupCount, 
    getPublicGroupByIndex,
    getGroup, 
    getGroupMember,
    getContribution,
    getModeChangeStatus,
    getMemberVoteStatus,
    // Write functions
    createPublicGroup,
    createPrivateGroup,
    joinPublicGroup, 
    deposit, 
    claimPayout,
    withdrawSavings,
    openWithdrawalWindow: async (groupId: string, onFinish: (data: any) => void, onCancel?: () => void) => {
        await callContract('open-withdrawal-window', [Cl.stringUtf8(groupId)], onFinish, onCancel);
    },
    openEnrollmentPeriod,
    closeEnrollmentAndStart,
    addMember,
    startFirstCycle: async (groupId: string, onFinish: (data: any) => void, onCancel?: () => void) => {
        await callContract('start-first-cycle', [Cl.stringUtf8(groupId)], onFinish, onCancel);
    },
    
    // Admin Tools
    creatorMarkPaid: async (groupId: string, memberAddress: string, cycle: number, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('creator-mark-paid', [
        Cl.stringUtf8(groupId),
        Cl.principal(memberAddress),
        Cl.uint(cycle)
      ], onFinish, onCancel);
    },
    creatorSetStatus: async (groupId: string, newStatus: number, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('creator-set-status', [Cl.stringUtf8(groupId), Cl.uint(newStatus)], onFinish, onCancel);
    },
    creatorAdvanceCycle: async (groupId: string, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('creator-advance-cycle', [Cl.stringUtf8(groupId)], onFinish, onCancel);
    },

    // Mode Voting
    proposeModeChange: async (groupId: string, newMode: number, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('propose-mode-change', [Cl.stringUtf8(groupId), Cl.uint(newMode)], onFinish, onCancel);
    },
    voteOnModeChange: async (groupId: string, voteFor: boolean, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('vote-on-mode-change', [Cl.stringUtf8(groupId), Cl.bool(voteFor)], onFinish, onCancel);
    },
    cancelModeChange: async (groupId: string, onFinish: (data: any) => void, onCancel?: () => void) => {
      await callContract('cancel-mode-change', [Cl.stringUtf8(groupId)], onFinish, onCancel);
    },
    // Constants
    CONTRACT_ADDRESS,
    CONTRACT_NAME
  };
}
