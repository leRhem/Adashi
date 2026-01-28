import { 
  Coins, Users, Globe, 
  UserPlus, Zap, Shield, TrendingUp 
} from 'lucide-react';
import type { Group } from '../../types';
import { formatSTX } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

interface GroupCardProps extends Group {
  isMember?: boolean;
  canJoin?: boolean;
}

export default function GroupCard(props: GroupCardProps) {
  const {
    id,
    groupName,
    description,
    mode,
    isPublic,
    depositAmount,
    currentMembers,
    maxMembers,
    isMember,
    canJoin
  } = props;

  const navigate = useNavigate();

  /* Shared group data construction */
  const getGroupData = () => ({
      id,
      groupName,
      description,
      creator: props.creator,
      depositAmount,
      currentMembers,
      maxMembers,
      cycleDuration: props.cycleDuration,
      status: props.status,
      isPublic,
      mode,
      currentCycle: props.currentCycle,
      enrollmentEndBlock: props.enrollmentEndBlock,
      createdAt: props.createdAt,
      poolBalance: props.poolBalance
  });

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Navigating to join group', id);
    const groupData = getGroupData();
    navigate(`/group/${id}`, { 
      state: { 
        group: groupData,
        autoOpenJoin: true 
      } 
    });
  };

  const handleViewDetails = () => {
    const groupData = getGroupData();
    console.log('Navigating to group details with state:', groupData);
    navigate(`/group/${id}`, { state: { group: groupData } });
  };

  return (
    <div 
      onClick={handleViewDetails}
      className="bg-bg-secondary backdrop-blur-sm rounded-[32px] shadow-xl hover:shadow-[#AEEF3C]/10 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full active:scale-[0.98]"
    >
      {/* Header with Mode Badge */}
      <div className="relative h-28 bg-gradient-to-br from-[#0A1628] to-[#0D7377]">
        {/* Mode Badge */}
        <div className="absolute top-4 right-4">
          {(mode === 1 || mode === 2 || mode === 3) && (
            <span className={`
              px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center space-x-1.5
              ${mode === 1 ? 'bg-[#AEEF3C] text-navy' : 'bg-white/10 text-white'}
            `}>
              {mode === 1 && <><Zap className="w-3 h-3" /> <span>ROSCA</span></>}
              {mode === 2 && <><Shield className="w-3 h-3" /> <span>Collective</span></>}
              {mode === 3 && <><TrendingUp className="w-3 h-3" /> <span>Interest</span></>}
            </span>
          )}
        </div>

        {/* Group Type Badge */}
        {isPublic && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-md border border-white/10">
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </span>
          </div>
        )}

        {/* Group Initial/Icon */}
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <div className="w-14 h-14 bg-bg-primary rounded-2xl shadow-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Users className="w-6 h-6 text-[#AEEF3C]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-10 flex-grow flex flex-col">
        {/* Group Name */}
        <h3 className="text-xl font-black text-text-base mb-2 group-hover:text-[#0D7377] transition-colors leading-tight">
          {groupName}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-text-secondary mb-6 line-clamp-2 h-8 font-medium italic leading-relaxed">
            {description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatItem 
            icon={<Coins className="w-3.5 h-3.5" />} 
            label="Deposit" 
            value={`${formatSTX(depositAmount)} STX`} 
            color="text-[#0D7377]"
          />
          <StatItem 
            icon={<Users className="w-3.5 h-3.5" />} 
            label="Members" 
            value={`${currentMembers}/${maxMembers || 100}`} 
            color="text-text-base"
          />
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4">
          {canJoin ? (
            <button
              onClick={handleJoin}
              className="w-full px-4 py-3 bg-[#AEEF3C] text-[#0A1628] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#AEEF3C]/10 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join Group</span>
            </button>
          ) : isMember ? (
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-3 bg-bg-base text-text-base rounded-xl font-black text-xs uppercase tracking-widest hover:bg-bg-secondary transition-all active:scale-95 shadow-sm"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-3 bg-bg-base text-text-tertiary rounded-xl font-black text-xs uppercase tracking-widest hover:text-text-base transition-all active:scale-95 shadow-sm"
            >
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center space-x-3 bg-bg-base p-3 rounded-2xl shadow-sm">
      <div className={`${color} opacity-60`}>
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-xs font-black text-text-base truncate`}>
          {value}
        </p>
      </div>
    </div>
  );
}
