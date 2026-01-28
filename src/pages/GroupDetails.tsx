import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, UserPlus, DollarSign, 
  Calendar, User, Coins, Users, BarChart, 
  Activity, Shield, Info, Globe, Zap, Loader2,
  PlayCircle, LogOut, Clock, History
} from 'lucide-react';
import type { Group, Member } from '../types';
import type { GroupStatus, GroupMode } from '../types';
import { formatSTX, formatAddress, getModeLabel } from '../utils/format';
import Modal from '../components/ui/Modal';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { useContract, STATUS_ENROLLMENT, STATUS_ACTIVE } from '../hooks/useContract';
import { motion } from 'framer-motion';

interface HistoryItem {
  type: 'deposit' | 'payout' | 'withdrawal';
  amount: number;
  cycle: number;
  status: 'confirmed' | 'pending';
  timestamp?: number;
}

export default function GroupDetails() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userAddress } = useStacksConnect();
  const { getGroup, getGroupMember, joinPublicGroup, deposit, claimPayout, withdrawSavings, closeEnrollmentAndStart, openEnrollmentPeriod } = useContract();
  
  // Helper to convert blocks to days (1 block ≈ 10 minutes on Stacks)
  const formatCycleDuration = (blocks: number): string => {
    const days = Math.round((blocks * 10) / (60 * 24)); // 10 min per block
    if (days === 0) return 'less than a day';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    return `${Math.round(days / 30)} months`;
  };
  
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [knownMembers, setKnownMembers] = useState<Member[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const { getContribution } = useContract();
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get group data from router state (passed from GroupCard)
  // Get group data
  const refetchGroupData = useCallback(async () => {
      setError(null);
      
      try {
        let currentGroup = location.state?.group as Group | undefined;
        let fetchedGroupId = groupId;

        if (groupId) {
          console.log('Fetching fresh group data by ID:', groupId);
          const groupData = await getGroup(groupId);
          
          if (groupData) {
            const statusMap: Record<number, GroupStatus> = {
              [STATUS_ENROLLMENT]: 'enrollment',
              [STATUS_ACTIVE]: 'active',
              2: 'completed',
              3: 'paused',
              4: 'withdrawal_open'
            };
            
            currentGroup = {
              id: groupId,
              groupName: groupData.name,
              description: groupData.description || '',
              creator: groupData.creator,
              depositAmount: groupData.depositPerMember,
              currentMembers: groupData.membersCount,
              maxMembers: groupData.maxMembers,
              cycleDuration: groupData.cycleDurationBlocks,
              status: statusMap[groupData.status] || 'enrollment',
              isPublic: groupData.isPublicListed,
              mode: groupData.groupMode as GroupMode,
              currentCycle: groupData.currentCycle,
              enrollmentEndBlock: groupData.enrollmentEndBlock,
              createdAt: groupData.createdAt,
              poolBalance: groupData.totalPoolBalance
            };
          } else if (!currentGroup) {
             setError('Group not found. Please navigate from the Browse page.');
          }
        } 
        
        if (currentGroup) {
            setGroup(currentGroup);

            // ALWAYS check if current user is a member
            let currentUserMember: Member | null = null;
            if (userAddress && fetchedGroupId) {
              const member = await getGroupMember(fetchedGroupId, userAddress);
              if (member) {
                console.log('Membership confirmed for:', userAddress);
                setIsMember(true);
                currentUserMember = {
                  address: userAddress,
                  name: member.memberName,
                  position: member.payoutPosition,
                  joinedAt: member.joinedAt,
                  lastDepositCycle: 0,
                  hasWithdrawn: member.hasWithdrawn,
                  hasReceivedPayout: member.hasReceivedPayout,
                  totalContributed: member.totalContributed
                };
                setMemberData(currentUserMember);
              } else {
                console.log('User is NOT a member:', userAddress);
                setIsMember(false);
                setMemberData(null);
              }
            }

            // Also check if creator is a member (to show in list)
            let creatorMember: Member | null = null;
            if (currentGroup.creator && fetchedGroupId && currentGroup.creator !== userAddress) {
                const cMember = await getGroupMember(fetchedGroupId, currentGroup.creator);
                if (cMember) {
                     creatorMember = {
                        address: currentGroup.creator,
                        name: cMember.memberName,
                        position: cMember.payoutPosition,
                        joinedAt: cMember.joinedAt,
                        lastDepositCycle: 0,
                        hasWithdrawn: cMember.hasWithdrawn
                     };
                }
            }

            // Build known members list
            const membersList: Member[] = [];
            if (currentUserMember) membersList.push(currentUserMember);
            if (creatorMember) membersList.push(creatorMember);
            
            // Sort by position
            membersList.sort((a, b) => a.position - b.position);
            setKnownMembers(membersList);
        }
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Failed to load group data');
      }
  }, [groupId, userAddress, location.state, getGroup, getGroupMember]);

  useEffect(() => {
    setIsLoading(true);
    refetchGroupData().finally(() => setIsLoading(false));
  }, [refetchGroupData]);



  // Fetch history when group and member data is available
  useEffect(() => {
    const fetchHistory = async () => {
        if (!group || !userAddress || !groupId || !memberData) return;
        
        const history: HistoryItem[] = [];
        const BATCH_SIZE = 5;
        
        // 1. Check past deposits (Contributions)
        // We check from cycle 0 up to current cycle
        try {
            const totalCycles = group.currentCycle + 1; // 0 to currentCycle inclusive
            
            for (let i = 0; i < totalCycles; i += BATCH_SIZE) {
                const batchPromises = [];
                // Create a batch of promises
                for (let j = i; j < Math.min(i + BATCH_SIZE, totalCycles); j++) {
                     batchPromises.push(getContribution(groupId, userAddress, j).then(c => ({ cycle: j, data: c })));
                }

                // Wait for this batch to complete
                const results = await Promise.all(batchPromises);
                
                results.forEach(({ cycle, data }) => {
                    if (data && data.isPaid) {
                        history.push({
                            type: 'deposit',
                            amount: data.amount > 0 ? data.amount : group.depositAmount, // Fallback if amount 0 (old contract version)
                            cycle: cycle,
                            status: 'confirmed'
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Error fetching history contributions:', e);
        }

        // 2. Check Payout
        if (memberData.hasReceivedPayout) {
            history.push({
                type: 'payout',
                amount: group.depositAmount * group.currentMembers, // Est. amount
                cycle: memberData.position, // Payout happens at their position
                status: 'confirmed'
            });
        }

        // 3. Check Withdrawal
        if (memberData.hasWithdrawn) {
             history.push({
                type: 'withdrawal',
                amount: memberData.totalContributed || 0,
                cycle: group.currentCycle,
                status: 'confirmed'
            });
        }

        // Sort by cycle desc
        history.sort((a, b) => b.cycle - a.cycle);
        setHistoryItems(history);
    };

    if (activeTab === 'History') {
        fetchHistory();
    }
  }, [group, memberData, activeTab, groupId, userAddress, getContribution]);

  // Derived state
  // Debug creator check
  if (group && userAddress) {
      console.log('Creator Check:', {
          creator: group.creator,
          user: userAddress,
          match: group.creator === userAddress,
          matchLower: group.creator.toLowerCase() === userAddress.toLowerCase()
      });
  }
  const isCreator = group && userAddress && (group.creator === userAddress || group.creator.toLowerCase() === userAddress.toLowerCase());
  const canJoin = group && !isMember && group.status === 'enrollment';
  const needsDeposit = group && isMember && group.status === 'active';
  const canClaim = group && group.mode === 1 && isMember && memberData && !memberData.hasWithdrawn && group.status === 'active' && group.currentCycle === memberData.position;
  const canWithdraw = group && group.mode === 2 && isMember && group.status === 'withdrawal_open';
  const canStartGroup = isCreator && group && group.status === 'enrollment';

  // Handle auto-open join modal from navigation state
  useEffect(() => {
    if (location.state?.autoOpenJoin && !isMember && group && group.status === 'enrollment') {
        console.log('Auto-opening join modal');
        setShowJoinModal(true);
    }
  }, [location.state, isMember, group]);

  // Handle join group
  const handleJoinGroup = async () => {
    if (!groupId || !memberName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await joinPublicGroup(
        groupId,
        memberName,
        async (data) => {
          console.log('Joined group successfully:', data);
          setShowJoinModal(false);
          setIsMember(true);
          // Refresh group data
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error joining group:', err);
      setIsSubmitting(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!groupId) return;
    
    setIsSubmitting(true);
    try {
      await deposit(
        groupId,
        async (data) => {
          console.log('Deposit successful:', data);
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error making deposit:', err);
      setIsSubmitting(false);
    }
  };

  // Handle claim payout
  const handleClaimPayout = async () => {
    if (!groupId) return;
    
    setIsSubmitting(true);
    try {
      await claimPayout(
        groupId,
        async (data) => {
          console.log('Payout claimed:', data);
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error claiming payout:', err);
      setIsSubmitting(false);
    }
  };

  // Handle withdraw savings (Collective mode)
  // Open withdraw confirmation
  const handleWithdrawSavings = () => {
    if (!groupId || !memberData) return;
    setShowWithdrawModal(true);
  };

  // Execute withdrawal
  const confirmWithdrawal = async () => {
     if (!groupId) return;
    
    setIsSubmitting(true);
    try {
      await withdrawSavings(
        groupId,
        async (data) => {
          console.log('Savings withdrawn:', data);
          setShowWithdrawModal(false);
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error withdrawing savings:', err);
      setIsSubmitting(false);
    }
  };

  // Handle start group (Creator only - close enrollment and start)
  const handleStartGroup = async () => {
    if (!groupId || !isCreator) return;
    
    setIsSubmitting(true);
    try {
      await closeEnrollmentAndStart(
        groupId,
        async (data) => {
          console.log('Group started:', data);
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error starting group:', err);
      setIsSubmitting(false);
    }
  };

  // Handle open enrollment (Creator only - between cycles)
  const handleOpenEnrollment = async () => {
    if (!groupId || !isCreator) return;
    
    setIsSubmitting(true);
    try {
      // Default to same duration as cycle for now (could be a modal input)
      await openEnrollmentPeriod(
        groupId,
        144, // approx 24 hours
        async (data) => {
          console.log('Enrollment opened:', data);
          await refetchGroupData();
          setIsSubmitting(false);
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error opening enrollment:', err);
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base py-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#AEEF3C] animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-medium">Loading group data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !group) {
    return (
      <div className="min-h-screen bg-bg-base py-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-text-base mb-2">Error Loading Group</h2>
          <p className="text-text-secondary font-medium mb-6">{error || 'Group not found'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="px-6 py-3 bg-[#AEEF3C] text-navy rounded-xl font-bold"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-bg-base py-32 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-12 flex items-center space-x-3 text-text-tertiary hover:text-text-base transition-colors group font-black uppercase tracking-[0.2em] text-[10px]"
        >
          <div className="p-2.5 bg-bg-secondary rounded-xl shadow-sm group-hover:bg-bg-tertiary transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Back to Browse</span>
        </button>

        {/* Group Header Card */}
        <div className="bg-bg-secondary rounded-[48px] shadow-sm overflow-hidden mb-12 transition-colors duration-300">
          {/* Cover/Gradient */}
          <div className="h-64 bg-gradient-to-br from-[#0A1628] to-[#0D7377] relative">
            <div className="absolute top-8 right-8 flex space-x-3">
              <span className={`
                px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md
                ${group.mode === 1 ? 'bg-[#AEEF3C] text-navy' : 'bg-white/10 text-white'}
              `}>
                {getModeLabel(group.mode)}
              </span>
              {group.isPublic && (
                <span className="px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center space-x-2 backdrop-blur-md">
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </span>
              )}
            </div>
            
            {/* Decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-[40px]" />
                <div className="absolute bottom-10 right-20 w-48 h-48 bg-deep-teal rounded-full blur-[60px]" />
            </div>
          </div>

          {/* Header Content */}
          <div className="p-10 pt-0 relative">
            {/* Avatar Overlap */}
            <div className="absolute -top-16 left-10">
              <div className="w-32 h-32 bg-bg-primary rounded-[40px] shadow-2xl flex items-center justify-center transition-colors">
                <Users className="w-16 h-16 text-[#AEEF3C]" />
              </div>
            </div>

            <div className="pt-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="flex-grow">
                <div className="flex items-center space-x-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-black text-text-base tracking-tight uppercase">
                        {group.groupName}
                    </h1>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {group.status}
                    </span>
                </div>
                
                <p className="text-lg text-text-secondary font-medium max-w-2xl leading-relaxed italic">
                  {group.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-6 items-center">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-bg-base rounded-xl">
                    <User className="w-4 h-4 text-text-tertiary" />
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                      Admin: <span className="text-text-base">{formatAddress(group.creator)}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-bg-base rounded-xl">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                      Created: <span className="text-text-base">Block #{group.createdAt}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Major Actions */}
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                {canJoin && (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-8 py-5 bg-[#AEEF3C] text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#AEEF3C]/10 flex items-center justify-center space-x-3 transform active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Join Group</span>
                  </button>
                )}

                {!canJoin && group.status === 'enrollment' && isMember && (
                    <div className="flex flex-col items-center justify-center px-6 py-4 bg-bg-base/50 rounded-2xl border border-white/5">
                        <span className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Status: Waiting to Start</span>
                        <span className="text-xs text-text-tertiary italic">Deposits open when active.</span>
                    </div>
                )}
                
                {isMember && needsDeposit && (
                  <button
                    onClick={handleDeposit}
                    disabled={isSubmitting}
                    className={`px-8 py-5 bg-deep-teal text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-deep-teal/20 flex items-center justify-center space-x-3 transform active:scale-95 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                    <span>{isSubmitting ? 'Processing...' : 'Make Deposit'}</span>
                  </button>
                )}

                {canClaim && (
                    <button
                        onClick={handleClaimPayout}
                        disabled={isSubmitting}
                        className={`px-8 py-5 bg-[#AEEF3C] text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#AEEF3C]/10 flex items-center justify-center space-x-3 transform active:scale-95 ${isSubmitting ? 'opacity-70' : 'animate-pulse'}`}
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        <span>{isSubmitting ? 'Processing...' : 'Claim Payout'}</span>
                    </button>
                )}

                {/* Withdraw Savings - Collective Mode */}
                {canWithdraw && (
                    <button
                        onClick={handleWithdrawSavings}
                        disabled={isSubmitting}
                        className={`px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-3 transform active:scale-95 ${isSubmitting ? 'opacity-70' : ''}`}
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                        <span>{isSubmitting ? 'Processing...' : 'Withdraw Savings'}</span>
                    </button>
                )}

                {/* Start Group - Creator Only */}
                {canStartGroup && group.currentMembers >= 2 && (
                    <button
                        onClick={handleStartGroup}
                        disabled={isSubmitting}
                        className={`px-8 py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-3 transform active:scale-95 ${isSubmitting ? 'opacity-70' : ''}`}
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                        <span>{isSubmitting ? 'Starting...' : 'Start Group'}</span>
                    </button>
                )}

                <button className="p-5 bg-bg-base text-text-tertiary rounded-2xl hover:text-deep-teal transition-all group active:scale-95 shadow-sm">
                  <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-6">
                <DetailStat icon={<Coins className="w-5 h-5" />} label="Deposit" value={`${formatSTX(group.depositAmount)} STX`} subValue="per cycle" color="teal" />
                <DetailStat icon={<Users className="w-5 h-5" />} label="Members" value={`${group.currentMembers}/${group.maxMembers || 100}`} subValue="joined" color="lime" />
                <DetailStat icon={<Clock className="w-5 h-5" />} label="Cycle Time" value={formatCycleDuration(group.cycleDuration)} subValue="per cycle" color="amber" />
                <DetailStat icon={<BarChart className="w-5 h-5" />} label="Progress" value={`${group.currentCycle} of ${group.maxMembers}`} subValue="cycles done" color="blue" />
                <DetailStat icon={<DollarSign className="w-5 h-5" />} label="Pool" value={`${formatSTX(group.poolBalance)} STX`} subValue="total stored" color="emerald" />
            </div>

            {/* Creator Admin Panel - Always visible for creators */}
            {isCreator && (
              <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Admin Controls</span>
                </div>
                <p className="text-sm text-text-secondary mb-4">You are the creator of this group.</p>
                
                {group.status === 'enrollment' && group.currentMembers < 2 && (
                  <p className="text-xs text-amber-500 italic">At least 2 members needed to start the group.</p>
                )}

                {/* Re-open Enrollment Button */}
                {group.status === 'active' && group.isPublic && (
                   <div className="mt-4">
                      <button
                        onClick={handleOpenEnrollment}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-amber-500/20 text-amber-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500/30 transition-colors flex items-center space-x-2"
                      >
                         <UserPlus className="w-3 h-3" />
                         <span>Open Enrollment</span>
                      </button>
                      <p className="text-[10px] text-text-tertiary mt-2 italic">Allows new members to join for the next cycle.</p>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info & Content Tabs */}
        <div className="bg-bg-secondary rounded-[48px] shadow-sm overflow-hidden min-h-[500px] transition-colors duration-300">
          <div className="px-10">
            <nav className="flex space-x-12">
              {['Overview', 'Members', 'History'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-8 relative font-black text-xs uppercase tracking-widest transition-all
                    ${activeTab === tab
                      ? 'text-deep-teal dark:text-[#AEEF3C]'
                      : 'text-text-tertiary hover:text-text-base'
                    }
                  `}
                >
                  {tab}
                  {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTabDetails" 
                        className="absolute bottom-0 left-0 right-0 h-1 bg-deep-teal dark:bg-[#AEEF3C] rounded-t-full" 
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-10">
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2 space-y-12">
                      <div>
                        <h3 className="text-2xl font-black text-text-base mb-6 tracking-tight uppercase">Group Dynamics</h3>
                        <p className="text-text-secondary font-medium leading-relaxed mb-8 italic">
                            This group operates in <span className="text-deep-teal dark:text-[#AEEF3C] font-black">{getModeLabel(group.mode)}</span> mode. 
                            {group.mode === 1 
                                ? "Members receive a lump sum payout in a rotating order based on their join position. This requires high trust among participants." 
                                : "A collective savings vehicle where members deposit periodically and can withdraw their total savings at the end of the term or cycle."
                            }
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InfoCard title="Auto-Payouts" icon={<Zap className="w-5 h-5 text-amber-500" />} desc="Smart contracts handle distribution instantly when conditions are met." />
                            <InfoCard title="Verified Security" icon={<Shield className="w-5 h-5 text-emerald-500" />} desc="All funds are locked in a non-custodial contract on the Stacks blockchain." />
                        </div>
                      </div>

                      <div className="bg-bg-base rounded-[32px] p-8 transition-colors shadow-sm">
                         <div className="flex items-center space-x-3 mb-6">
                             <Activity className="w-6 h-6 text-deep-teal dark:text-[#AEEF3C]" />
                             <h3 className="text-xl font-black text-text-base tracking-tight uppercase">Cycle Breakdown</h3>
                         </div>
                         <div className="h-3 w-full bg-bg-secondary rounded-full mb-4 overflow-hidden p-0.5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-deep-teal to-[#AEEF3C] rounded-full" style={{ width: `${(group.currentCycle / Math.max(group.maxMembers ?? 1, 1)) * 100}%` }} />
                         </div>
                         <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Positions remaining: {Math.max(0, (group.maxMembers ?? 1) - group.currentCycle)} / {group.maxMembers ?? 1}</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-bg-base/50 rounded-[40px] p-8 italic backdrop-blur-sm shadow-sm">
                         <h4 className="text-text-base font-black mb-4 flex items-center space-x-2 uppercase text-xs">
                            <Info className="w-5 h-5 text-deep-teal" />
                            <span>Quick Tip</span>
                        </h4>
                        <p className="text-text-secondary font-medium leading-relaxed text-sm">
                            Always ensure you have enough STX in your wallet at least 24 hours before the cycle deadline to avoid penalties.
                        </p>
                      </div>
                   </div>
                </div>
            )}
            
            {activeTab === 'Members' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-text-base tracking-tight uppercase">Participant List</h3>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{group.currentMembers} Active Members</span>
                    </div>

                    {knownMembers.length > 0 ? (
                        <div className="space-y-4">
                            {knownMembers.map((mem) => (
                                <div key={mem.address} className="p-4 bg-bg-base rounded-2xl flex items-center justify-between border border-transparent hover:border-bg-tertiary transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold">
                                            {mem.position}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-base flex items-center gap-2">
                                                {mem.name}
                                                {mem.address === group.creator && (
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] rounded-full uppercase tracking-wider font-black">Creator</span>
                                                )}
                                                {mem.address === userAddress && (
                                                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-500 text-[10px] rounded-full uppercase tracking-wider font-black">You</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-text-tertiary font-mono">{formatAddress(mem.address)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Verified Member</p>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="p-4 border-2 border-dashed border-bg-tertiary rounded-2xl text-center">
                                <p className="text-sm text-text-tertiary italic mb-2">
                                    + {Math.max(group.currentMembers - knownMembers.length, 0)} other members (not listed)
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-bg-base rounded-3xl">
                            <Users className="w-12 h-12 text-text-tertiary/40 mx-auto mb-4" />
                            <p className="text-text-secondary font-medium italic">No members visible yet.</p>
                            <p className="text-text-tertiary text-sm mt-2">The contract does not support listing all members directly.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'History' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-text-base tracking-tight uppercase">Activity History</h3>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Your Transactions</span>
                    </div>

                    <div className="space-y-4">
                        {/* Cycle Info Card */}
                        <div className="p-6 bg-bg-base rounded-3xl flex items-center space-x-4">
                            <div className="w-12 h-12 bg-deep-teal/10 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-deep-teal" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Cycle Duration</p>
                                <p className="text-lg font-black text-text-base">{formatCycleDuration(group.cycleDuration)}</p>
                            </div>
                        </div>

                        {/* Transaction History List */}
                        {historyItems.length > 0 ? (
                            <div className="space-y-3">
                                {historyItems.map((item, idx) => (
                                    <div key={idx} className="p-4 bg-bg-base rounded-2xl flex items-center justify-between border border-transparent hover:border-bg-tertiary transition-all">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                item.type === 'withdrawal' ? 'bg-amber-500/10 text-amber-500' :
                                                item.type === 'deposit' ? 'bg-teal-500/10 text-teal-500' : 
                                                'bg-[#AEEF3C]/10 text-deep-teal'
                                            }`}>
                                                {item.type === 'deposit' ? <DollarSign className="w-5 h-5" /> : 
                                                 item.type === 'payout' ? <Zap className="w-5 h-5" /> :
                                                 <LogOut className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-base capitalize">{item.type}</p>
                                                <p className="text-xs text-text-tertiary font-mono">Cycle #{item.cycle}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-text-base">{formatSTX(item.amount)} STX</p>
                                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{item.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-bg-base rounded-3xl">
                                <History className="w-12 h-12 text-text-tertiary/40 mx-auto mb-4" />
                                <p className="text-text-secondary font-medium italic">No transactions found.</p>
                                <p className="text-text-tertiary text-sm mt-2">Your deposits and payouts will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Confirmation Modal */}
      <Modal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          title="Confirm Withdrawal"
          maxWidth="md"
      >
          <div className="space-y-6">
              <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center">
                  <p className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-2">Total Savings</p>
                  <p className="text-4xl font-black text-text-base">
                      {formatSTX(memberData?.totalContributed || 0)} <span className="text-lg text-text-tertiary">STX</span>
                  </p>
              </div>

              <p className="text-text-secondary font-medium leading-relaxed">
                  You are about to withdraw your entire accumulated savings from this group. This action will transfer the funds to your wallet.
              </p>

              <div className="flex items-center space-x-3 p-4 bg-bg-base rounded-2xl">
                  <Info className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                  <p className="text-xs text-text-tertiary">
                      Network fees will apply. The transaction may take a few minutes to confirm on the Stacks blockchain.
                  </p>
              </div>

              <div className="flex space-x-4 pt-4">
                   <button
                      onClick={() => setShowWithdrawModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-bg-base text-text-secondary rounded-xl font-bold hover:bg-bg-tertiary transition-colors"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={confirmWithdrawal}
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                  >
                       {isSubmitting ? (
                          <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                          </>
                      ) : (
                          <>
                              <LogOut className="w-5 h-5" />
                              <span>Confirm Withdrawal</span>
                          </>
                      )}
                  </button>
              </div>
          </div>
      </Modal>
  
      {/* Modals */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Savings Group" maxWidth="lg">
         <div className="space-y-8">
            <div className="p-6 bg-bg-base rounded-3xl shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-bg-base rounded-2xl flex items-center justify-center shadow-inner">
                        <UserPlus className="w-6 h-6 text-deep-teal" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Next Available Spot</p>
                        <p className="text-lg font-black text-text-base uppercase tracking-tight">Position #{group.currentMembers + 1}</p>
                    </div>
                </div>
                <p className="text-sm text-text-secondary font-medium italic">By joining, you commit to <span className="font-black text-text-base">{formatSTX(group.depositAmount)} STX</span> every <span className="font-black text-text-base">{formatCycleDuration(group.cycleDuration)}</span>.</p>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-text-tertiary uppercase tracking-[0.2em] ml-2">Display Name</label>
                <input 
                    type="text" 
                    placeholder="e.g. Satoshi"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/10 focus:outline-none font-black transition-all text-text-base placeholder:text-text-tertiary/30 shadow-inner"
                />
                <p className="text-[10px] text-text-tertiary font-bold italic px-2">Visible to other members.</p>
            </div>

            <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowJoinModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 text-text-tertiary font-black uppercase tracking-widest hover:text-text-base transition-colors active:scale-95"
                >
                    Cancel
                </button>
                <button 
                  onClick={handleJoinGroup}
                  disabled={isSubmitting || !memberName.trim()}
                  className={`flex-[2] py-4 bg-[#AEEF3C] text-navy rounded-2xl font-black shadow-xl shadow-[#AEEF3C]/10 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 active:scale-95 ${(isSubmitting || !memberName.trim()) ? 'opacity-70' : ''}`}
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    <span>{isSubmitting ? 'Joining...' : 'Confirm & Join'}</span>
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

function DetailStat({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
    const colorClasses = {
        teal: 'bg-deep-teal/10 text-deep-teal',
        lime: 'bg-[#AEEF3C]/10 text-deep-teal dark:text-[#AEEF3C]',
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        amber: 'bg-amber-500/10 text-amber-500',
    }[color] || 'bg-bg-base text-text-tertiary';

    return (
        <div className="p-8 bg-bg-base rounded-[40px] shadow-sm hover:bg-bg-secondary hover:shadow-xl transition-all group cursor-default">
            <div className={`w-12 h-12 ${colorClasses} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-text-base tracking-tighter mb-1">{value}</p>
            <p className="text-[10px] font-black italic text-text-tertiary uppercase tracking-[0.2em]">{subValue}</p>
        </div>
    );
}

function InfoCard({ title, icon, desc }: { title: string, icon: React.ReactNode, desc: string }) {
    return (
        <div className="p-6 bg-bg-base rounded-[32px] shadow-sm hover:bg-bg-secondary transition-all group">
            <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-bg-secondary rounded-xl group-hover:bg-bg-tertiary transition-colors">
                    {icon}
                </div>
                <h4 className="font-black text-text-base uppercase text-[10px] tracking-[0.15em]">{title}</h4>
            </div>
            <p className="text-xs text-text-secondary font-medium leading-relaxed italic">{desc}</p>
        </div>
    );
}
