// src/types/index.ts

export type GroupMode = 1 | 2 | 3; // 1: ROSCA, 2: Collective, 3: Interest-Bearing

export type GroupStatus = 'enrollment' | 'active' | 'completed' | 'paused' | 'withdrawal_open';

export interface Group {
  id: string;
  groupName: string;
  description?: string;
  creator: string;
  depositAmount: number; // in microSTX
  currentMembers: number;
  maxMembers: number;
  cycleDuration: number; // in blocks
  status: GroupStatus;
  isPublic: boolean;
  mode: GroupMode;
  currentCycle: number;
  enrollmentEndBlock: number;
  createdAt: number;
  poolBalance: number; // in microSTX
}

export interface Member {
  address: string;
  name: string;
  position: number;
  joinedAt: number;
  lastDepositCycle: number;
  hasWithdrawn: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'claim';
  amount: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  txId: string;
}
