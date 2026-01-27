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
