import { 
  Cl,
  fetchCallReadOnlyFunction,
  cvToValue,
  cvToHex,
  hexToCV
} from '@stacks/transactions';
import type { ClarityValue } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { useStacksConnect } from './useStacksConnect';

// =============================================================================
// CONTRACT CONFIGURATION
// =============================================================================
const CONTRACT_ADDRESS = 'ST1M9HB8FHTGZ0TA84TNW6MP9H8P39AYK13H3C9J1';
const CONTRACT_NAME = 'adashi_v2';
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
    onCancel?: () => void
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
      // Use Stacks testnet API URL
      const apiUrl = 'https://api.testnet.hiro.so';
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
      depositPerMember: Number(result['deposit-per-member'] || result.deposit_per_member),
      cycleDurationBlocks: Number(result['cycle-duration-blocks'] || result.cycle_duration_blocks),
      maxMembers: Number(result['max-members'] || result.max_members),
      membersCount: Number(result['members-count'] || result.members_count),
      currentCycle: Number(result['current-cycle'] || result.current_cycle),
      cycleStartBlock: Number(result['cycle-start-block'] || result.cycle_start_block),
      status: Number(result.status),
      totalPoolBalance: Number(result['total-pool-balance'] || result.total_pool_balance),
      createdAt: Number(result['created-at'] || result.created_at),
      groupMode: Number(result['group-mode'] || result.group_mode),
      pendingModeChange: result['pending-mode-change'] ?? null,
      modeChangeVotesFor: Number(result['mode-change-votes-for'] || 0),
      modeChangeVotesAgainst: Number(result['mode-change-votes-against'] || 0),
      groupType: Number(result['group-type'] || result.group_type),
      enrollmentPeriodBlocks: Number(result['enrollment-period-blocks'] || 0),
      enrollmentEndBlock: Number(result['enrollment-end-block'] || 0),
      autoStartWhenFull: Boolean(result['auto-start-when-full']),
      isPublicListed: Boolean(result['is-public-listed']),
    };
  };

  /**
   * Get member data within a group
   */
  const getGroupMember = async (groupId: string, memberAddress: string): Promise<MemberData | null> => {
    const result = await callReadOnly('get-group-member', [
      Cl.stringUtf8(groupId),
      Cl.principal(memberAddress)
    ]);
    if (!result) return null;

    return {
      memberName: result['member-name'] || result.member_name,
      payoutPosition: Number(result['payout-position'] || result.payout_position),
      hasReceivedPayout: Boolean(result['has-received-payout'] || result.has_received_payout),
      joinedAt: Number(result['joined-at'] || result.joined_at),
      totalContributed: Number(result['total-contributed'] || result.total_contributed),
      hasWithdrawn: Boolean(result['has-withdrawn'] || result.has_withdrawn),
      votedOnModeChange: Boolean(result['voted-on-mode-change'] || result.voted_on_mode_change),
      voteForModeChange: Boolean(result['vote-for-mode-change'] || result.vote_for_mode_change),
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
      paidAtBlock: Number(result['paid-at-block'] || result.paid_at_block),
      isPaid: Boolean(result['is-paid'] || result.is_paid),
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
    await callContract(
      'deposit',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel
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
    await callContract(
      'claim-payout',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel
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
    await callContract(
      'withdraw-savings',
      [Cl.stringUtf8(groupId)],
      onFinish,
      onCancel
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
    // Write functions
    createPublicGroup,
    createPrivateGroup,
    joinPublicGroup, 
    deposit, 
    claimPayout,
    withdrawSavings,
    openEnrollmentPeriod,
    closeEnrollmentAndStart,
    addMember,
    // Constants
    CONTRACT_ADDRESS,
    CONTRACT_NAME
  };
}
