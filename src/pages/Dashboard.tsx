import { useState } from 'react';
import { 
  Users, TrendingUp, AlertCircle, Award, 
  PlusCircle, Search, Bell, ArrowRight, DollarSign 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GroupCard from '../components/ui/GroupCard';
import type { Group } from '../types';
import { useStacksConnect } from '../hooks/useStacksConnect';

// Mock data for user's groups
const MY_GROUPS: Group[] = [
  {
    id: '2',
    groupName: 'Summer Vacay Pool',
    description: 'Saving for that epic summer trip to Bali. Join us!',
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
    createdAt: Date.now() - 1000000,
    poolBalance: 4000000000
  },
  {
    id: '5',
    groupName: 'Family Savings',
    description: 'Private group for family collective savings.',
    creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    depositAmount: 100000000, 
    currentMembers: 4,
    maxMembers: 4,
    cycleDuration: 144 * 30,
    status: 'active',
    isPublic: false,
    mode: 2,
    currentCycle: 1,
    enrollmentEndBlock: 0,
    createdAt: Date.now(),
    poolBalance: 400000000
  }
];

export default function Dashboard() {
  const { userData } = useStacksConnect();
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Groups', value: '2', icon: Users, color: 'blue' },
    { label: 'Total Saved', value: '4,500 STX', icon: TrendingUp, color: 'emerald' },
    { label: 'Pending Actions', value: '1', icon: AlertCircle, color: 'amber' },
    { label: 'Total Received', value: '0 STX', icon: Award, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              Welcome back, {userData?.profile?.name || 'Saver'}!
            </h1>
            <p className="text-gray-500 font-medium">
              You have <span className="text-primary-600 font-bold">1 action</span> requiring your attention today.
            </p>
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/create')}
              className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center space-x-2 transform active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Group</span>
            </button>
            <button className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors relative">
              <Bell className="w-6 h-6 text-gray-400" />
              <div className="absolute top-3.5 right-4 w-2 h-2 bg-error-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all">
              <div className={`w-14 h-14 bg-${stat.color === 'emerald' ? 'success' : stat.color === 'amber' ? 'warning' : stat.color}-50 rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className={`w-7 h-7 text-${stat.color === 'emerald' ? 'success' : stat.color === 'amber' ? 'warning' : stat.color}-600`} />
              </div>
              <p className="text-3xl font-black text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Action Card */}
        <div className="mb-12 bg-gradient-to-r from-amber-500 to-amber-600 p-8 rounded-[40px] shadow-2xl shadow-amber-500/20 text-white relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-1">Pending Deposit Due</h3>
                  <p className="text-amber-50 font-medium">Summer Vacay Pool • Cycle 4 • 200 STX</p>
                </div>
              </div>
              <button 
                className="px-8 py-4 bg-white text-amber-600 rounded-2xl font-black hover:bg-amber-50 transition-all flex items-center justify-center space-x-3 group-hover:translate-x-2 transform duration-300"
              >
                <span>Deposit Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
        </div>

        {/* Groups Section */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Groups</h2>
            
            <div className="flex items-center space-x-2 p-1.5 bg-gray-50 rounded-2xl">
              <TabButton label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
              <TabButton label="Pending" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
              <TabButton label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MY_GROUPS.map((group) => (
              <GroupCard key={group.id} {...group} isMember={true} />
            ))}
            
            {/* Join More Empty Card */}
            <div 
              onClick={() => navigate('/browse')}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition-colors">
                <Search className="w-8 h-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Discover More</h3>
              <p className="text-gray-400 font-medium mb-6">Find more groups to join and save with the community.</p>
              <span className="text-primary-600 font-black text-sm uppercase tracking-widest flex items-center space-x-2">
                <span>Browse Groups</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-white shadow-md text-gray-900' 
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}
