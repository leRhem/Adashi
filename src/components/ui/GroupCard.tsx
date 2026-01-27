import { Coins, Users, Clock, Activity, Globe, AlertTriangle, UserPlus } from 'lucide-react';
import type { Group } from '../../types';
import { formatSTX, blocksToReadable } from '../../utils/format';
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
    cycleDuration,
    status,
    currentCycle,
    isMember,
    canJoin
  } = props;

  const navigate = useNavigate();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Join logic will be handled by parent or modal
    console.log('Join group', id);
  };

  const handleViewDetails = () => {
    navigate(`/group/${id}`);
  };

  return (
    <div 
      onClick={handleViewDetails}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 flex flex-col h-full"
    >
      {/* Header with Mode Badge */}
      <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-800">
        {/* Mode Badge */}
        <div className="absolute top-4 right-4">
          <span className={`
            px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm
            ${mode === 1 ? 'bg-blue-100 text-blue-700' : ''}
            ${mode === 2 ? 'bg-purple-100 text-purple-700' : ''}
            ${mode === 3 ? 'bg-emerald-100 text-emerald-700' : ''}
          `}>
            {mode === 1 && '⚡ ROSCA'}
            {mode === 2 && '🔒 Collective'}
            {mode === 3 && '📈 Interest'}
          </span>
        </div>

        {/* Group Type Badge */}
        {isPublic && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm">
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </span>
          </div>
        )}

        {/* Group Icon/Avatar */}
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white transition-transform group-hover:scale-110">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-10 flex-grow flex flex-col">
        {/* Group Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {groupName}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
            {description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatItem 
            icon={<Coins className="w-4 h-4 text-primary-600" />} 
            label="Deposit" 
            value={`${formatSTX(depositAmount)} STX`} 
            bgColor="bg-primary-50" 
          />
          <StatItem 
            icon={<Users className="w-4 h-4 text-purple-600" />} 
            label="Members" 
            value={`${currentMembers}/${maxMembers === 0 ? '100' : maxMembers}`} 
            bgColor="bg-purple-50" 
          />
          <StatItem 
            icon={<Clock className="w-4 h-4 text-blue-600" />} 
            label="Cycle" 
            value={blocksToReadable(cycleDuration)} 
            bgColor="bg-blue-50" 
          />
          <StatItem 
            icon={<Activity className={`w-4 h-4 ${status === 'active' ? 'text-success-600' : 'text-amber-600'}`} />} 
            label="Status" 
            value={status} 
            bgColor={status === 'active' ? 'bg-success-50' : 'bg-amber-50'} 
            capitalize 
          />
        </div>

        {/* Progress Bar (if active) */}
        {status === 'active' && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">Cycle {currentCycle} of {maxMembers}</span>
              <span className="font-bold text-primary-600">{Math.round((currentCycle / (maxMembers || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(currentCycle / (maxMembers || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Risk Warning for Model 1 Public Groups */}
        {isPublic && mode === 1 && (
          <div className="mb-6 p-3 bg-error-50 border border-error-100 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] leading-tight text-error-700 font-medium">
                <strong>High Risk:</strong> Public ROSCA groups allow untrusted members who may leave early.
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto flex space-x-3">
          {canJoin && (
            <button
              onClick={handleJoin}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join Group</span>
            </button>
          )}
          
          {isMember ? (
            <button
              onClick={handleViewDetails}
              className="flex-1 px-4 py-2.5 bg-success-50 text-success-700 border border-success-200 rounded-xl font-bold hover:bg-success-100 transition shadow-sm active:scale-95"
            >
              View Dashboard
            </button>
          ) : !canJoin && (
            <button
              onClick={handleViewDetails}
              className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm active:scale-95"
            >
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, bgColor, capitalize = false }: { icon: React.ReactNode, label: string, value: string, bgColor: string, capitalize?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`p-2.5 ${bgColor} rounded-xl shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold text-gray-900 truncate ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
