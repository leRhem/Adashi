import { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle,
  PlusCircle, Search, Bell, ArrowRight,
  Briefcase, Wallet, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GroupCard from '../components/ui/GroupCard';
import StatsCreditCard from '../components/ui/StatsCreditCard';
import CreateGroupModal from '../components/modals/CreateGroupModal';
import AccessFundsModal, { type ClaimableItem } from '../components/modals/AccessFundsModal';
import type { Group, GroupMode, GroupStatus, Member } from '../types';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { useContract, STATUS_ENROLLMENT, STATUS_ACTIVE } from '../hooks/useContract';

export default function Dashboard() {
  const { userData, userAddress } = useStacksConnect();
  const { getPublicGroupCount, getPublicGroupByIndex, getGroupMember } = useContract();
  
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [claimableItems, setClaimableItems] = useState<ClaimableItem[]>([]);
  const navigate = useNavigate();

  // Fetch user's groups from contract (both created AND joined)
  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const count = await getPublicGroupCount();
        console.log('Public group count:', count);
        const userGroups: Group[] = [];
        const memberCache = new Map<string, any>(); // Cache for member data
        
        for (let i = 0; i < count; i++) {
          const groupData = await getPublicGroupByIndex(i);
          console.log(`Group ${i}:`, groupData);
          
          if (groupData && groupData.groupId) {
            // Check if user is creator
            const isCreator = groupData.creator === userAddress;
            
            // Check if user is a member (only if not creator to avoid duplicate check)
            let isMember = false;
            if (!isCreator) {
              try {
                const memberData = await getGroupMember(groupData.groupId, userAddress);
                isMember = memberData !== null;
                if (isMember && memberData) {
                    memberCache.set(groupData.groupId, memberData);
                }
                console.log(`Membership check for ${groupData.groupId}:`, isMember);
              } catch (err) {
                console.error(`Error checking membership for ${groupData.groupId}:`, err);
              }
            }
            
            // Include group if user is creator OR member
            if (isCreator || isMember) {
              const statusMap: Record<number, GroupStatus> = {
                [STATUS_ENROLLMENT]: 'enrollment',
                [STATUS_ACTIVE]: 'active',
                2: 'completed',
                3: 'paused',
                4: 'withdrawal_open'
              };
              
              userGroups.push({
                id: groupData.groupId,
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
            }
          }
        }
        

        setMyGroups(userGroups);

        // Fetch Member Data for all groups to determine claimable balance

        
        // This could be optimized to run partially in parallel with group fetching, but keeping it simple for now
        // Fetch Member Data for all groups to determine claimable balance
        const items: ClaimableItem[] = [];
        
        for (const grp of userGroups) {
            try {
                // Use cached member data if available, otherwise fetch
                let memberRaw = memberCache.get(grp.id);
                if (!memberRaw) {
                     memberRaw = await getGroupMember(grp.id, userAddress);
                }

                if (memberRaw) {
                     const member: Member = {
                        address: userAddress,
                        name: memberRaw.memberName,
                        position: memberRaw.payoutPosition,
                        joinedAt: memberRaw.joinedAt,
                        lastDepositCycle: (memberRaw as any).lastDepositCycle || 0, 
                        hasWithdrawn: memberRaw.hasWithdrawn,
                        hasReceivedPayout: memberRaw.hasReceivedPayout,
                        totalContributed: memberRaw.totalContributed
                     };

                     // Check ROSCA Payout
                     if (grp.mode === 1 && grp.status === 'active' && !member.hasWithdrawn && !member.hasReceivedPayout && grp.currentCycle === member.position) {
                         // Estimate Pot: Members * Deposit
                         items.push({
                             group: grp,
                             amount: grp.currentMembers * grp.depositAmount,
                             type: 'payout',
                             cycle: member.position
                         });
                     }
                     
                     // Check Collective Withdrawal
                     if (grp.mode === 2 && grp.status === 'withdrawal_open' && !member.hasWithdrawn) {
                         items.push({
                             group: grp,
                             amount: member.totalContributed || 0,
                             type: 'savings'
                         });
                     }
                }
            } catch (err) {
                 console.error(`Error fetching member details for ${grp.id}:`, err);
            }
        }
        setClaimableItems(items);

      } catch (err) {
        console.error('Error fetching user groups:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyGroups();
  }, [userAddress]);

  // Handle withdraw click
  const handleWithdraw = () => {
    setWithdrawModalOpen(true);
  };
  
  const claimableBalance = claimableItems.reduce((sum, item) => sum + item.amount, 0);

  const filteredGroups = useMemo(() => {
    return myGroups.filter(group => {
      if (activeTab === 'active') return group.status === 'active';
      if (activeTab === 'pending') return group.status === 'enrollment';
      if (activeTab === 'completed') return group.status === 'completed';
      return true;
    });
  }, [myGroups, activeTab]);

  return (
    <div className="min-h-screen bg-bg-base py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-text-base tracking-tight mb-2">
              Welcome back, {userData?.profile?.name || 'Saver'}!
            </h1>
            <p className="text-text-secondary font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#AEEF3C]" />
              <span>You have <span className="text-[#AEEF3C] font-bold">1 action</span> requiring your attention today.</span>
            </p>
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-4 bg-[#AEEF3C] text-[#0A1628] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#AEEF3C]/20 flex items-center space-x-2 transform active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Group</span>
            </button>
            <button className="p-4 bg-bg-secondary rounded-2xl shadow-sm hover:bg-white/10 transition-colors relative transform active:scale-95">
              <Bell className="w-6 h-6 text-text-tertiary" />
              <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Unified Stats Card */}
        <div className="mb-12">
          <StatsCreditCard 
            balance={claimableBalance / 1000000}  // Convert to STX
            activeGroups={myGroups.filter(g => g.status === 'active' || g.status === 'enrollment').length}  
            pendingActions={myGroups.filter(g => g.status === 'enrollment').length} 
            totalReceived={0}
            userAddress={userAddress}
            onWithdraw={handleWithdraw}
          />
        </div>

        {/* Pending Action Card */}
        <div className="mb-12 bg-deep-teal p-8 rounded-[40px] shadow-2xl shadow-deep-teal/20 text-white relative overflow-hidden group cursor-pointer transform transition-all active:scale-[0.99] border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <Wallet className="w-8 h-8 text-[#AEEF3C]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-1">Pending Deposit Due</h3>
                  <p className="text-white/60 font-medium">Summer Vacay Pool • Cycle 4 • 200 STX</p>
                </div>
              </div>
              <button 
                className="px-8 py-4 bg-[#AEEF3C] text-[#0A1628] rounded-2xl font-black hover:scale-110 transition-all flex items-center justify-center space-x-3 group-hover:translate-x-2 transform duration-300 shadow-xl shadow-black/20 active:scale-95"
              >
                <span>Deposit Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
        </div>

        {/* Groups Section */}
        <div className="bg-bg-secondary rounded-[40px] shadow-lg p-10 backdrop-blur-sm transition-colors duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <h2 className="text-2xl font-black text-text-base tracking-tight flex items-center space-x-3">
              <Briefcase className="w-6 h-6 text-[#AEEF3C]" />
              <span>My Groups</span>
            </h2>
            
            <div className="flex items-center space-x-2 p-1.5 bg-bg-base rounded-[20px] shadow-inner">
              <TabButton label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
              <TabButton label="Pending" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
              <TabButton label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? (
              <div className="md:col-span-2 text-center py-20 bg-bg-base/30 rounded-[32px]">
                <Loader2 className="w-8 h-8 text-[#AEEF3C] animate-spin mx-auto mb-4" />
                <p className="text-text-tertiary font-bold italic">Loading your groups...</p>
              </div>
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <GroupCard key={group.id} {...group} isMember={true} />
              ))
            ) : (
                <div className="md:col-span-2 text-center py-20 bg-bg-base/30 rounded-[32px]">
                    <p className="text-text-tertiary font-bold italic">No {activeTab} groups found.</p>
                </div>
            )}
            
            {/* Join More Empty Card */}
            <div 
              onClick={() => navigate('/browse')}
              className="bg-bg-base/50 rounded-[32px] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[#AEEF3C]/5 transition-all transform active:scale-[0.98] shadow-sm"
            >
              <div className="w-16 h-16 bg-bg-base rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#AEEF3C] transition-all transition-colors duration-300">
                <Search className="w-8 h-8 text-text-tertiary group-hover:text-[#0A1628] transition-colors transform group-hover:scale-110" />
              </div>
              <h3 className="text-xl font-black text-text-base mb-2">Discover More</h3>
              <p className="text-text-secondary font-medium mb-6">Find more groups to join and save with the community.</p>
              <span className="text-[#AEEF3C] font-black text-sm uppercase tracking-widest flex items-center space-x-2">
                <span>Browse Groups</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          // Trigger a page refresh to fetch the newly created group
          window.location.reload();
        }}
      />
      
      <AccessFundsModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        claimableItems={claimableItems}
        onSuccess={() => {
            setWithdrawModalOpen(false);
            window.location.reload();
        }}
      />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 ${
        active 
          ? 'bg-bg-secondary shadow-lg text-text-base scale-[1.02]' 
          : 'text-text-tertiary hover:text-text-base hover:bg-bg-secondary/30'
      }`}
    >
      {label}
    </button>
  );
}
