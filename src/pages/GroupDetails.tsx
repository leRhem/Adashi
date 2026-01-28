import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, UserPlus, DollarSign, 
  Calendar, User, Coins, Users, BarChart, 
  Activity, Shield, Info, Globe, Zap, Loader2
} from 'lucide-react';
import type { Group, Member } from '../types';
import type { GroupStatus, GroupMode } from '../types';
import { formatSTX, formatAddress, getModeLabel } from '../utils/format';
import Modal from '../components/ui/Modal';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { useContract, STATUS_ENROLLMENT, STATUS_ACTIVE } from '../hooks/useContract';
import { motion } from 'framer-motion';

export default function GroupDetails() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userAddress } = useStacksConnect();
  const { getGroup, getGroupMember, joinPublicGroup, deposit, claimPayout } = useContract();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberData, setMemberData] = useState<Member | null>(null);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get group data from router state (passed from GroupCard)
  useEffect(() => {
    const fetchGroupData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First, check if group data was passed via router state
        const stateGroup = location.state?.group as Group | undefined;
        
        if (stateGroup) {
          console.log('Using group data from router state:', stateGroup);
          setGroup(stateGroup);
          
          // Check creator status
          if (userAddress && stateGroup.creator === userAddress) {
            setIsMember(true);
          }
        } else if (groupId) {
          // Fallback: try to fetch from contract (may not work with generated IDs)
          console.log('Attempting to fetch group by ID:', groupId);
          const groupData = await getGroup(groupId);
          
          if (groupData) {
            const statusMap: Record<number, GroupStatus> = {
              [STATUS_ENROLLMENT]: 'enrollment',
              [STATUS_ACTIVE]: 'active',
              2: 'completed',
              3: 'paused',
              4: 'withdrawal_open'
            };
            
            setGroup({
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
            });
            
            // Check if current user is a member
            if (userAddress) {
              const member = await getGroupMember(groupId, userAddress);
              if (member) {
                setIsMember(true);
                setMemberData({
                  address: userAddress,
                  name: member.memberName,
                  position: member.payoutPosition,
                  joinedAt: member.joinedAt,
                  lastDepositCycle: 0, // Not in contract data
                  hasWithdrawn: member.hasWithdrawn
                });
              }
            }
          } else {
            setError('Group not found. Please navigate from the Browse page.');
          }
        } else {
          setError('No group ID provided');
        }
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Failed to load group data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, userAddress, location.state]);

  // Derived state
  const canJoin = group && !isMember && group.status === 'enrollment';
  const needsDeposit = group && isMember && group.status === 'active';
  const canClaim = group && group.mode === 1 && isMember && memberData && !memberData.hasWithdrawn;

  // Handle join group
  const handleJoinGroup = async () => {
    if (!groupId || !memberName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await joinPublicGroup(
        groupId,
        memberName,
        (data) => {
          console.log('Joined group successfully:', data);
          setShowJoinModal(false);
          setIsMember(true);
          // Refresh group data
          window.location.reload();
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
        (data) => {
          console.log('Deposit successful:', data);
          setIsSubmitting(false);
          window.location.reload();
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
        (data) => {
          console.log('Payout claimed:', data);
          setIsSubmitting(false);
          window.location.reload();
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
                      Started: <span className="text-text-base">{group.createdAt ? new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
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

                <button className="p-5 bg-bg-base text-text-tertiary rounded-2xl hover:text-deep-teal transition-all group active:scale-95 shadow-sm">
                  <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                <DetailStat icon={<Coins className="w-5 h-5" />} label="Deposit" value={`${formatSTX(group.depositAmount)} STX`} subValue="per cycle" color="teal" />
                <DetailStat icon={<Users className="w-5 h-5" />} label="Members" value={`${group.currentMembers}/${group.maxMembers || 100}`} subValue="joined" color="lime" />
                <DetailStat icon={<BarChart className="w-5 h-5" />} label="Cycle" value={`${group.currentCycle} of ${group.maxMembers}`} subValue="in progress" color="blue" />
                <DetailStat icon={<DollarSign className="w-5 h-5" />} label="Pool" value={`${formatSTX(group.poolBalance)} STX`} subValue="total stored" color="emerald" />
            </div>
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

                    <div className="text-center py-16 bg-bg-base rounded-3xl">
                        <Users className="w-12 h-12 text-text-tertiary/40 mx-auto mb-4" />
                        <p className="text-text-secondary font-medium italic">Member list will be fetched from the blockchain.</p>
                        <p className="text-text-tertiary text-sm mt-2">This group has {group.currentMembers} members.</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

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
                <p className="text-sm text-text-secondary font-medium italic">By joining, you commit to <span className="font-black text-text-base">{formatSTX(group.depositAmount)} STX</span> every <span className="font-black text-text-base">2 weeks</span>.</p>
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
                <h4 className="font-black text-text-base tracking-tight uppercase text-[10px] tracking-[0.15em]">{title}</h4>
            </div>
            <p className="text-xs text-text-secondary font-medium leading-relaxed italic">{desc}</p>
        </div>
    );
}
