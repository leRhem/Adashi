// src/utils/format.ts
export function formatSTX(microSTX: number): string {
  return (microSTX / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function blocksToReadable(blocks: number): string {
  const days = Math.floor(blocks / 144);
  if (days === 0) return `${Math.floor(blocks / 6)} hours`;
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  return `${Math.floor(days / 30)} months`;
}

export function getModeLabel(mode: number): string {
  switch(mode) {
    case 1: return 'Traditional ROSCA';
    case 2: return 'Collective Savings';
    case 3: return 'Interest-Bearing';
    default: return 'Unknown';
  }
}

export function getStatusColor(status: string): string {
  switch(status) {
    case 'enrollment': return 'amber';
    case 'active': return 'green';
    case 'completed': return 'gray';
    case 'paused': return 'red';
    default: return 'gray';
  }
}

/**
 * Calculate time remaining from blocks remaining
 * Assumes ~10 minutes per block on Stacks
 */
export function blocksToTimeRemaining(blocksRemaining: number): {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  isExpired: boolean;
} {
  if (blocksRemaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0, isExpired: true };
  }
  
  const totalMinutes = blocksRemaining * 10; // ~10 minutes per block
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  
  return { days, hours, minutes, totalMinutes, isExpired: false };
}

/**
 * Format countdown for display
 */
export function formatCountdown(blocksRemaining: number): string {
  const { days, hours, minutes, isExpired } = blocksToTimeRemaining(blocksRemaining);
  
  if (isExpired) return 'Expired';
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

/**
 * Get urgency level for countdown styling
 */
export function getCountdownUrgency(blocksRemaining: number): 'normal' | 'warning' | 'critical' | 'expired' {
  if (blocksRemaining <= 0) return 'expired';
  
  const hoursRemaining = (blocksRemaining * 10) / 60;
  
  if (hoursRemaining <= 2) return 'critical';
  if (hoursRemaining <= 24) return 'warning';
  return 'normal';
}
