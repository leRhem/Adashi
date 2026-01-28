import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GroupCard from '../components/ui/GroupCard';
import { useContract, STATUS_ENROLLMENT, STATUS_ACTIVE } from '../hooks/useContract';
import type { Group, GroupMode, GroupStatus } from '../types';

export default function BrowsePage() {
  const { getPublicGroupCount, getPublicGroupByIndex } = useContract();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<GroupMode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GroupStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch public groups from contract
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching public groups...');
        const count = await getPublicGroupCount();
        console.log('Public group count:', count);
        
        if (count === 0) {
          console.log('No public groups found on the blockchain');
          setGroups([]);
          setIsLoading(false);
          return;
        }
        
        const fetchedGroups: Group[] = [];
        
        for (let i = 0; i < count; i++) {
          console.log(`Fetching group at index ${i}...`);
          // Note: get-public-group-by-index returns FULL group data, not a group ID
          const groupData = await getPublicGroupByIndex(i);
          console.log(`Group data at index ${i}:`, groupData);
          
          if (groupData) {
            // Map contract data to Group type
            const statusMap: Record<number, GroupStatus> = {
              [STATUS_ENROLLMENT]: 'enrollment',
              [STATUS_ACTIVE]: 'active',
              2: 'completed',
              3: 'paused',
              4: 'withdrawal_open'
            };
            
            fetchedGroups.push({
              id: groupData.groupId, // Use the actual group ID from the contract
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
        
        console.log('Fetched groups:', fetchedGroups);
        setGroups(fetchedGroups);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups from the blockchain. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // getPublicGroupCount and getPublicGroupByIndex are stable hook functions

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = modeFilter === 'all' || group.mode === modeFilter;
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [groups, searchQuery, modeFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-bg-base py-32 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-text-base tracking-tight mb-4 uppercase">
            Browse Groups
          </h1>
          <p className="text-text-secondary font-medium text-lg italic">
            Discover and join community savings groups on the Stacks blockchain.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-bg-secondary rounded-[32px] shadow-lg p-6 mb-12 backdrop-blur-md transition-colors duration-300">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="search"
                placeholder="Search groups by name or description..."
                className="w-full pl-14 pr-6 py-5 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/10 focus:outline-none transition-all font-bold text-text-base placeholder:text-text-tertiary/50 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${showFilters ? 'bg-deep-teal text-white shadow-lg shadow-deep-teal/20' : 'bg-bg-base text-text-tertiary hover:bg-bg-tertiary shadow-sm'}`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-8 pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-xs font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Group Mode</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip label="All Modes" active={modeFilter === 'all'} onClick={() => setModeFilter('all')} />
                      <FilterChip label="ROSCA" active={modeFilter === 1} onClick={() => setModeFilter(1)} />
                      <FilterChip label="Collective" active={modeFilter === 2} onClick={() => setModeFilter(2)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Status</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip label="All Status" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                      <FilterChip label="Enrollment" active={statusFilter === 'enrollment'} onClick={() => setStatusFilter('enrollment')} />
                      <FilterChip label="Active" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button 
                      onClick={() => {setModeFilter('all'); setStatusFilter('all'); setSearchQuery('');}}
                      className="text-[10px] font-black text-text-tertiary uppercase tracking-widest hover:text-deep-teal transition flex items-center space-x-2"
                    >
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="text-center py-40 bg-bg-secondary rounded-[40px] shadow-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-bg-base rounded-[32px] mb-8 shadow-inner animate-pulse">
              <Loader2 className="w-10 h-10 text-[#AEEF3C] animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-text-base mb-2 tracking-tight">Loading Groups...</h3>
            <p className="text-text-secondary font-medium italic">Fetching data from the blockchain.</p>
          </div>
        ) : error ? (
          <div className="text-center py-40 bg-bg-secondary rounded-[40px] shadow-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-500/10 rounded-[32px] mb-8 shadow-inner">
              <Search className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-text-base mb-2 tracking-tight">Error Loading Groups</h3>
            <p className="text-text-secondary font-medium italic">{error}</p>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} {...group} canJoin={group.status === 'enrollment'} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-bg-secondary rounded-[40px] shadow-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-bg-base rounded-[32px] mb-8 shadow-inner">
              <Search className="w-10 h-10 text-text-tertiary/40" />
            </div>
            <h3 className="text-2xl font-black text-text-base mb-2 tracking-tight">No groups found</h3>
            <p className="text-text-secondary font-medium italic">Try adjusting your filters or search keywords.</p>
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
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
        active 
          ? 'bg-[#AEEF3C] text-[#0A1628] shadow-lg shadow-[#AEEF3C]/20 transition-all' 
          : 'bg-bg-base text-text-tertiary hover:bg-bg-tertiary shadow-sm'
      }`}
    >
      {label}
    </button>
  );
}
