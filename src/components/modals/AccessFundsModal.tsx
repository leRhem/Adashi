
import { useState } from 'react';
import { DollarSign, Zap, LogOut, Loader2, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatSTX } from '../../utils/format';
import type { Group } from '../../types';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../context/ToastContext';

export type ClaimableItem = 
  | { group: Group; amount: number; type: 'payout'; cycle: number }
  | { group: Group; amount: number; type: 'savings' };

interface AccessFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimableItems: ClaimableItem[];
  onSuccess: () => void;
}

export default function AccessFundsModal({ isOpen, onClose, claimableItems, onSuccess }: AccessFundsModalProps) {
  const { claimPayout, withdrawSavings } = useContract();
  const showToast = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleClaim = async (item: ClaimableItem) => {
    setProcessingId(item.group.id);
    
    try {
        if (item.type === 'payout') {
            await claimPayout(
                item.group.id,
                (data) => {
                    console.log('Payout claimed:', data);
                    setProcessingId(null);
                    onSuccess();
                },
                () => {
                    setProcessingId(null);
                    showToast({
                        type: 'error',
                        title: 'Payout Failed',
                        message: 'The payout transaction was cancelled or failed.',
                        duration: 5000
                    });
                }
            );
        } else {
            await withdrawSavings(
                item.group.id,
                (data) => {
                    console.log('Savings withdrawn:', data);
                    setProcessingId(null);
                    onSuccess();
                },
                () => {
                    setProcessingId(null);
                    showToast({
                        type: 'error',
                        title: 'Withdrawal Failed',
                        message: 'The withdrawal transaction was cancelled or failed.',
                        duration: 5000
                    });
                }
            );
        }
    } catch (err) {
        console.error('Error accessing funds:', err);
        setProcessingId(null);
        showToast({
            type: 'error',
            title: 'Error Processing Request',
            message: 'An unexpected error occurred while accessing funds.',
            duration: 5000
        });
    }
  };

  const totalAvailable = claimableItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Funds" maxWidth="md">
        <div className="space-y-6">
            {/* Header Summary */}
            <div className="p-6 bg-gradient-to-br from-[#0A1628] to-[#0D7377] rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#AEEF3C] opacity-10 rounded-full blur-[40px] -mr-10 -mt-10" />
                
                <p className="text-xs font-black text-[#AEEF3C] uppercase tracking-widest mb-1">Total Available</p>
                <div className="flex items-baseline space-x-2">
                    <h3 className="text-4xl font-black tracking-tighter">{formatSTX(totalAvailable)}</h3>
                    <span className="text-lg font-bold opacity-60">STX</span>
                </div>
                <p className="text-xs text-white/60 mt-2 font-medium">Across {claimableItems.length} groups</p>
            </div>

            {claimableItems.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-xs font-black text-text-tertiary uppercase tracking-widest pl-2">Available to Claim</p>
                    
                    {claimableItems.map((item) => (
                        <div key={`${item.group.id}-${item.type}`} className="p-4 bg-bg-base rounded-2xl flex items-center justify-between border border-transparent hover:border-bg-tertiary transition-all group">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    item.type === 'payout' ? 'bg-[#AEEF3C]/10 text-deep-teal' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                    {item.type === 'payout' ? <Zap className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-base text-sm truncate max-w-[150px]">{item.group.groupName}</h4>
                                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide">
                                        {item.type === 'payout' ? `Cycle #${item.cycle} Payout` : 'Total Savings'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <p className="font-black text-text-base">{formatSTX(item.amount)} STX</p>
                                <button
                                    onClick={() => handleClaim(item)}
                                    disabled={!!processingId}
                                    className={`
                                        px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1 transition-all
                                        ${item.type === 'payout' 
                                            ? 'bg-[#AEEF3C] text-navy hover:scale-105 shadow-lg shadow-[#AEEF3C]/20' 
                                            : 'bg-emerald-500 text-white hover:scale-105 shadow-lg shadow-emerald-500/20'
                                        }
                                        ${processingId && processingId !== item.group.id ? 'opacity-30 cursor-not-allowed' : ''}
                                        ${processingId === item.group.id ? 'opacity-80 cursor-wait' : ''}
                                    `}
                                >
                                    {processingId === item.group.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <>
                                            <span>{item.type === 'payout' ? 'Claim' : 'Withdraw'}</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <div className="w-12 h-12 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-text-secondary font-medium">No funds available to claim right now.</p>
                </div>
            )}
        </div>
    </Modal>
  );
}
