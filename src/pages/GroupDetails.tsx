import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, UserPlus, DollarSign, Gift, 
  Calendar, User, Coins, Users, BarChart, 
  Activity, Shield, Info, MoreHorizontal, Globe, Zap
} from 'lucide-react';
import type { Group, Member } from '../types';
import { formatSTX, formatAddress, getModeLabel } from '../utils/format';
import Modal from '../components/ui/Modal';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { motion } from 'framer-motion';

// Mock data for a single group
const MOCK_GROUP: Group = {
  id: '2',
  groupName: 'Summer Vacay Pool',
  description: 'Saving for that epic summer trip to Bali. We are a group of friends saving up for a luxury villa and private tours. Join us for the adventure of a lifetime! Deposits are due every 2 weeks.',
  creator: 'ST2HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  depositAmount: 200000000, 
  currentMembers: 15,
  maxMembers: 20,
  cycleDuration: 144 * 14,
  status: 'active',
  isPublic: true,
  mode: 2,
  currentCycle: 3,
  enrollmentEndBlock: 120000,
  createdAt: Date.now() - 5000000,
  poolBalance: 4000000000
};

const MOCK_MEMBERS: Member[] = [
  { address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', name: 'Alice', position: 1, joinedAt: Date.now() - 5000000, lastDepositCycle: 3, hasWithdrawn: false },
  { address: 'ST2HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', name: 'Bob', position: 2, joinedAt: Date.now() - 4800000, lastDepositCycle: 3, hasWithdrawn: false },
  { address: 'ST3HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', name: 'Charlie', position: 3, joinedAt: Date.now() - 4600000, lastDepositCycle: 3, hasWithdrawn: false },
  { address: 'ST4HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', name: 'Dave', position: 4, joinedAt: Date.now() - 4400000, lastDepositCycle: 2, hasWithdrawn: false },
];

export default function GroupDetails() {
  useParams();
  const navigate = useNavigate();
  useStacksConnect();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // In a real app, we'd fetch the group by ID here
  const group = MOCK_GROUP;
  const isMember = true; // Mocked
  const canJoin = !isMember && group.status === 'enrollment';
  const needsDeposit = isMember && group.status === 'active';
  const canClaim = group.mode === 1 && isMember; // Mocked claimable state

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center space-x-3 text-gray-500 hover:text-gray-900 transition-colors group font-bold uppercase tracking-widest text-xs"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Back to Browse</span>
        </button>

        {/* Group Header Card */}
        <div className="bg-white rounded-[48px] shadow-xl shadow-gray-200/50 overflow-hidden mb-12 border border-gray-100">
          {/* Cover/Gradient */}
          <div className="h-64 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 relative">
            <div className="absolute top-8 right-8 flex space-x-3">
              <span className={`
                px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg
                ${group.mode === 1 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
              `}>
                {getModeLabel(group.mode)}
              </span>
              {group.isPublic && (
                <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center space-x-2">
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </span>
              )}
            </div>
            
            {/* Decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-[40px]" />
                <div className="absolute bottom-10 right-20 w-48 h-48 bg-purple-300 rounded-full blur-[60px]" />
            </div>
          </div>

          {/* Header Content */}
          <div className="p-10 pt-0 relative">
            {/* Avatar Overlap */}
            <div className="absolute -top-16 left-10">
              <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl border-8 border-white flex items-center justify-center">
                <Users className="w-16 h-16 text-primary-600" />
              </div>
            </div>

            <div className="pt-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="flex-grow">
                <div className="flex items-center space-x-4 mb-4">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        {group.groupName}
                    </h1>
                    <span className="px-3 py-1 bg-success-50 text-success-600 rounded-lg text-xs font-black uppercase tracking-widest border border-success-100">
                      {group.status}
                    </span>
                </div>
                
                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                  {group.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-6 items-center">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Admin: <span className="text-gray-900">{formatAddress(group.creator)}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Started: <span className="text-gray-900">May 12, 2026</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Major Actions */}
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                {canJoin && (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-8 py-5 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center space-x-3 transform active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Join Group</span>
                  </button>
                )}
                
                {isMember && needsDeposit && (
                  <button
                    className="px-8 py-5 bg-success-600 text-white rounded-2xl font-black hover:bg-success-700 transition-all shadow-xl shadow-success-500/20 flex items-center justify-center space-x-3 transform active:scale-95"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Make Deposit</span>
                  </button>
                )}

                {canClaim && (
                    <button
                        className="px-8 py-5 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center space-x-3 transform active:scale-95 animate-pulse"
                    >
                        <Gift className="w-5 h-5" />
                        <span>Claim Payout</span>
                    </button>
                )}

                <button className="p-5 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl hover:bg-white hover:text-primary-600 hover:border-primary-100 hover:shadow-lg transition-all group">
                  <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
                
                <button className="p-5 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl hover:bg-white transition-all">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                <DetailStat icon={<Coins className="w-5 h-5 text-primary-600" />} label="Deposit" value={`${formatSTX(group.depositAmount)} STX`} subValue="per cycle" color="primary" />
                <DetailStat icon={<Users className="w-5 h-5 text-purple-600" />} label="Total Members" value={`${group.currentMembers}/${group.maxMembers || 100}`} subValue="joined" color="purple" />
                <DetailStat icon={<BarChart className="w-5 h-5 text-blue-600" />} label="Current Cycle" value={`${group.currentCycle} of ${group.maxMembers}`} subValue="in progress" color="blue" />
                <DetailStat icon={<DollarSign className="w-5 h-5 text-success-600" />} label="Pool Balance" value={`${formatSTX(group.poolBalance)} STX`} subValue="total stored" color="success" />
            </div>
          </div>
        </div>

        {/* Info & Content Tabs */}
        <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
          <div className="border-b border-gray-100 px-10">
            <nav className="flex space-x-12">
              {['Overview', 'Members', 'Contributions', 'Activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-8 relative font-black text-sm uppercase tracking-widest transition-all
                    ${activeTab === tab
                      ? 'text-primary-600'
                      : 'text-gray-400 hover:text-gray-900'
                    }
                  `}
                >
                  {tab}
                  {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" 
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
                        <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Group Dynamics</h3>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            This group operates in <span className="text-primary-600 font-bold">{getModeLabel(group.mode)}</span> mode. 
                            {group.mode === 1 
                                ? "Members receive a lump sum payout in a rotating order based on their join position. This requires high trust among participants." 
                                : "A collective savings vehicle where members deposit periodically and can withdraw their total savings at the end of the term or cycle."
                            }
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InfoCard title="Auto-Payouts" icon={<Zap className="w-5 h-5 text-warning-500" />} desc="Smart contracts handle distribution instantly when conditions are met." />
                            <InfoCard title="Verified Security" icon={<Shield className="w-5 h-5 text-success-500" />} desc="All funds are locked in a non-custodial contract on the Stacks blockchain." />
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                         <div className="flex items-center space-x-3 mb-6">
                             <Activity className="w-6 h-6 text-primary-600" />
                             <h3 className="text-xl font-black text-gray-900 tracking-tight">Cycle Breakdown</h3>
                         </div>
                         {/* Visual Cycle Timeline Placeholder */}
                         <div className="h-2 w-full bg-gray-200 rounded-full mb-4" />
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Current position: Cycle {group.currentCycle} / {group.maxMembers}</p>
                      </div>
                   </div>

                   <div>
                      <div className="bg-primary-50 rounded-[40px] p-8 border border-primary-100 italic">
                         <h4 className="text-primary-900 font-black mb-4 flex items-center space-x-2">
                            <Info className="w-5 h-5" />
                            <span>Quick Tip</span>
                        </h4>
                        <p className="text-primary-700 font-medium leading-relaxed">
                            Always ensure you have enough STX in your wallet at least 24 hours before the cycle deadline to avoid penalties or being marked inactive.
                        </p>
                      </div>
                   </div>
                </div>
            )}
            
            {activeTab === 'Members' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Participant List</h3>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{MOCK_MEMBERS.length} Active Members</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_MEMBERS.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:border-primary-100 hover:shadow-lg transition-all group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary-600 shadow-sm border border-gray-100 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                        #{member.position}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 underline decoration-primary-200">{member.name}</p>
                                        <p className="text-xs font-bold text-gray-400 font-mono tracking-tighter">{formatAddress(member.address)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-white text-[10px] font-black uppercase tracking-widest text-success-600 border border-success-100 rounded-lg">
                                        Up to date
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Summer Vacay Pool" maxWidth="lg">
         <div className="space-y-8">
            <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <UserPlus className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-primary-400 uppercase tracking-widest">New Spot Available</p>
                        <p className="text-lg font-black text-primary-900">Position #{group.currentMembers + 1}</p>
                    </div>
                </div>
                <p className="text-sm text-primary-700 font-medium">By joining this group, you commit to depositing <span className="font-black">200 STX</span> every <span className="font-black">2 weeks</span>.</p>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Display Name</label>
                <input 
                    type="text" 
                    placeholder="e.g. Satoshi" 
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 font-bold transition-all"
                />
                <p className="text-[10px] text-gray-400 font-bold italic px-2">This name will be visible to other members of the group.</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
                <button 
                  className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center justify-center space-x-2"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Confirm & Join</span>
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

function DetailStat({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
    const colorClasses = {
        primary: 'bg-primary-50 text-primary-600',
        purple: 'bg-purple-50 text-purple-600',
        blue: 'bg-blue-50 text-blue-600',
        success: 'bg-success-50 text-success-600',
    }[color] || 'bg-gray-50 text-gray-600';

    return (
        <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/30 transition-all group">
            <div className={`w-12 h-12 ${colorClasses} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight mb-1">{value}</p>
            <p className="text-[10px] font-black italic text-gray-400 uppercase tracking-[0.2em]">{subValue}</p>
        </div>
    );
}

function InfoCard({ title, icon, desc }: { title: string, icon: React.ReactNode, desc: string }) {
    return (
        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
                {icon}
                <h4 className="font-black text-gray-900 tracking-tight uppercase text-sm">{title}</h4>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}
