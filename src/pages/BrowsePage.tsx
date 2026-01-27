import { useState, useMemo } from 'react';
import { Search, ChevronDown, Filter, LayoutGrid } from 'lucide-react';
import GroupCard from '../components/ui/GroupCard';
import type { Group, GroupMode, GroupStatus } from '../types';

// Mock data for demo
const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    groupName: 'Lagos Tech Savings',
    description: 'A community for developers in Lagos to save together for gadgets and gear.',
    creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    depositAmount: 500000000, // 500 STX
    currentMembers: 8,
    maxMembers: 12,
    cycleDuration: 144 * 30, // 30 days
    status: 'enrollment',
    isPublic: true,
    mode: 1,
    currentCycle: 0,
    enrollmentEndBlock: 123456,
    createdAt: Date.now(),
    poolBalance: 0
  },
  {
    id: '2',
    groupName: 'Summer Vacay Pool',
    description: 'Saving for that epic summer trip to Bali. Join us!',
    creator: 'ST2HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    depositAmount: 200000000, // 200 STX
    currentMembers: 15,
    maxMembers: 20,
    cycleDuration: 144 * 14, // 14 days
    status: 'active',
    isPublic: true,
    mode: 2,
    currentCycle: 3,
    enrollmentEndBlock: 120000,
    createdAt: Date.now() - 1000000,
    poolBalance: 4000000000 // 4000 STX
  },
  {
    id: '3',
    groupName: 'Business Seed Fund',
    description: 'Grow your business with community capital. Low interest, high impact.',
    creator: 'ST3HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    depositAmount: 1000000000, // 1000 STX
    currentMembers: 5,
    maxMembers: 10,
    cycleDuration: 144 * 60, // 60 days
    status: 'enrollment',
    isPublic: true,
    mode: 1,
    currentCycle: 0,
    enrollmentEndBlock: 125000,
    createdAt: Date.now(),
    poolBalance: 0
  },
  {
    id: '4',
    groupName: 'Crypto HODLers',
    description: 'Collective savings for long-term STX holders. Lock and grow.',
    creator: 'ST4HQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    depositAmount: 50000000, // 50 STX
    currentMembers: 45,
    maxMembers: 100,
    cycleDuration: 144 * 365, // 1 year
    status: 'active',
    isPublic: true,
    mode: 2,
    currentCycle: 1,
    enrollmentEndBlock: 110000,
    createdAt: Date.now() - 5000000,
    poolBalance: 22500000000 // 22500 STX
  }
];

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<GroupMode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GroupStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredGroups = useMemo(() => {
    return MOCK_GROUPS.filter(group => {
      const matchesSearch = group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = modeFilter === 'all' || group.mode === modeFilter;
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [searchQuery, modeFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
            Browse Groups
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Discover and join community savings groups on the Stacks blockchain.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 p-6 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search groups by name or description..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-bold transition-all ${showFilters ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="hidden lg:flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl">
                <button className="p-2.5 bg-white shadow-sm rounded-xl">
                  <LayoutGrid className="w-5 h-5 text-primary-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-in">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Group Mode</label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip label="All Modes" active={modeFilter === 'all'} onClick={() => setModeFilter('all')} />
                  <FilterChip label="ROSCA" active={modeFilter === 1} onClick={() => setModeFilter(1)} />
                  <FilterChip label="Collective" active={modeFilter === 2} onClick={() => setModeFilter(2)} />
                  <FilterChip label="Interest" active={modeFilter === 3} onClick={() => setModeFilter(3)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Status</label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip label="All Status" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                  <FilterChip label="Enrollment" active={statusFilter === 'enrollment'} onClick={() => setStatusFilter('enrollment')} />
                  <FilterChip label="Active" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
                  <FilterChip label="Completed" active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
                </div>
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={() => {setModeFilter('all'); setStatusFilter('all'); setSearchQuery('');}}
                  className="text-sm font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} {...group} canJoin={group.status === 'enrollment'} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-8">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-500 font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
        active 
          ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' 
          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
