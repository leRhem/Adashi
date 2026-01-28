import { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Save, Coins, Users, 
  Clock, Globe, Lock, Shield, Info, ShieldCheck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useContract } from '../../hooks/useContract';
import logoGreen from '../../assets/Logo - green.png';
import logoWhite from '../../assets/Logo - white.png';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { theme } = useTheme();
  const { createPublicGroup, createPrivateGroup } = useContract();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 1, // 1: ROSCA, 2: Collective
    deposit: 100,
    maxMembers: 10,
    cycleDuration: 30, // days
    isPublic: true
  });

  // Sanitize group name for use as ID - only allow alphanumeric, spaces, and hyphens
  const sanitizeGroupId = (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .replace(/-+/g, '-')           // Remove multiple consecutive hyphens
      .slice(0, 40);                 // Limit length (contract allows 50 chars for ID)
  };

  // Validate group name has valid characters
  const isValidGroupName = (name: string): boolean => {
    // Allow letters, numbers, spaces, and basic punctuation
    const validPattern = /^[a-zA-Z0-9\s\-_.,'!?]+$/;
    return validPattern.test(name) && name.length >= 3 && name.length <= 100;
  };

  const validateStep = (currentStep: number) => {
    const newErrors: string[] = [];
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.push('Group name is required');
      } else if (formData.name.trim().length < 3) {
        newErrors.push('Group name must be at least 3 characters');
      } else if (formData.name.trim().length > 100) {
        newErrors.push('Group name must be less than 100 characters');
      } else if (!isValidGroupName(formData.name.trim())) {
        newErrors.push('Group name contains invalid characters. Use only letters, numbers, spaces, and basic punctuation.');
      }
      
      if (formData.description && formData.description.length > 256) {
        newErrors.push('Description must be less than 256 characters');
      }
    } else if (currentStep === 2) {
      if (formData.deposit <= 0) newErrors.push('Deposit must be greater than 0');
      if (formData.deposit > 10000) newErrors.push('Deposit cannot exceed 10,000 STX');
      if (formData.cycleDuration <= 0) newErrors.push('Cycle duration must be greater than 0');
      if (formData.cycleDuration > 365) newErrors.push('Cycle duration cannot exceed 365 days');
      if (formData.maxMembers < 2) newErrors.push('Must have at least 2 members');
      if (formData.maxMembers > 100) newErrors.push('Cannot exceed 100 members');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, totalSteps));
      setErrors([]);
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    setErrors([]);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    setIsSubmitting(true);
    
    // Generate safe group ID from name with timestamp for uniqueness
    const sanitizedName = sanitizeGroupId(formData.name);
    const groupId = `${sanitizedName}-${Date.now().toString(36)}`;
    
    // Convert deposit to microSTX (1 STX = 1,000,000 microSTX)
    const depositInMicroSTX = formData.deposit * 1000000;
    
    // Convert days to blocks (1 day ≈ 144 blocks)
    const cycleDurationBlocks = formData.cycleDuration * 144;
    
    // Default enrollment period: 7 days (1008 blocks)
    const enrollmentPeriodBlocks = 1008;
    
    const handleFinish = (data: any) => {
      console.log('Group created successfully:', data);
      setIsSubmitting(false);
      onSuccess();
      onClose();
    };
    
    const handleCancel = () => {
      console.log('Group creation cancelled');
      setIsSubmitting(false);
    };
    
    try {
      if (formData.isPublic) {
        await createPublicGroup(
          groupId,
          formData.name,
          formData.description || null,
          depositInMicroSTX,
          cycleDurationBlocks,
          formData.maxMembers,
          formData.mode,
          enrollmentPeriodBlocks,
          true, // autoStartWhenFull
          handleFinish,
          handleCancel
        );
      } else {
        await createPrivateGroup(
          groupId,
          formData.name,
          formData.description || null,
          depositInMicroSTX,
          cycleDurationBlocks,
          formData.maxMembers,
          formData.mode,
          handleFinish,
          handleCancel
        );
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setErrors(['Failed to create group. Please try again.']);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Savings Group" maxWidth="2xl">
      <div className="relative">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
                {[...Array(totalSteps)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-[#AEEF3C]' : 'bg-border-primary'}`} 
                    />
                ))}
            </div>
            <div className="text-xs font-black text-text-tertiary uppercase tracking-widest">Step {step}/{totalSteps}</div>
        </div>

        {/* Error Message */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-rose-500/10 rounded-2xl flex items-start space-x-3 animate-slide-in">
            <Info className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-text-base font-medium">
              {errors.map((err, i) => <p key={i}>{err}</p>)}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div>
                  <h2 className="text-2xl font-black text-text-base mb-1 tracking-tight">The Basics</h2>
                  <p className="text-text-secondary text-sm font-medium italic">Give your group a name and identity.</p>
              </div>

              <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Group Name</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Dream Home Fund" 
                          className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/20 focus:outline-[#AEEF3C] text-text-base font-bold transition-all text-lg placeholder:text-text-tertiary/50 shadow-inner"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                          rows={3}
                          placeholder="What is this group saving for?" 
                          className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/20 focus:outline-[#AEEF3C] text-text-base font-medium transition-all placeholder:text-text-tertiary/50 shadow-inner"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <SelectionCard 
                          active={formData.isPublic} 
                          onClick={() => setFormData({...formData, isPublic: true})}
                          title="Public"
                          icon={<Globe className="w-5 h-5" />}
                          desc="Discoverable"
                      />
                      <SelectionCard 
                          active={!formData.isPublic} 
                          onClick={() => setFormData({...formData, isPublic: false})}
                          title="Private"
                          icon={<Lock className="w-5 h-5" />}
                          desc="Invite-only"
                      />
                  </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div>
                  <h2 className="text-2xl font-black text-text-base mb-1 tracking-tight">Financial Model</h2>
                  <p className="text-text-secondary text-sm font-medium italic">Configure how the savings will work.</p>
              </div>

              {/* ROSCA Warning */}
              {formData.mode === 1 && (
                <div className="p-4 bg-amber-500/10 rounded-2xl flex items-start space-x-3 animate-slide-in">
                  <ShieldCheck className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-text-base leading-relaxed italic">
                    <strong>Warning:</strong> ROSCA mode depends entirely on member trust. We cannot control or prevent members from leaving early after receiving their payout. Proceed with caution!
                  </p>
                </div>
              )}

              <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <SelectionCard 
                          active={formData.mode === 1} 
                          onClick={() => setFormData({...formData, mode: 1})}
                          title="ROSCA"
                          icon={<Users className="w-5 h-5" />}
                          desc="Rotating"
                      />
                      <SelectionCard 
                          active={formData.mode === 2} 
                          onClick={() => setFormData({...formData, mode: 2})}
                          title="Collective"
                          icon={<Shield className="w-5 h-5" />}
                          desc="Shared Pool"
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1 flex items-center space-x-2">
                              <Coins className="w-3 h-3" />
                              <span>Deposit (STX)</span>
                          </label>
                          <input 
                              type="number" 
                              min="0"
                              className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/20 text-[#0D7377] dark:text-[#AEEF3C] font-black text-xl transition-all shadow-inner"
                              value={formData.deposit}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setFormData({...formData, deposit: isNaN(val) ? 0 : Math.max(0, val)});
                              }}
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1 flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>Cycle (Days)</span>
                          </label>
                          <input 
                              type="number"
                              min="1" 
                              className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/20 text-[#0D7377] dark:text-[#AEEF3C] font-black text-xl transition-all shadow-inner"
                              value={formData.cycleDuration}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setFormData({...formData, cycleDuration: isNaN(val) ? 1 : Math.max(1, val)});
                              }}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                          <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1 flex items-center space-x-2">
                              <Users className="w-3 h-3" />
                              <span>Max Members</span>
                          </label>
                          <input 
                              type="number"
                              min="2"
                              max="100"
                              className="w-full px-6 py-4 bg-bg-base rounded-2xl focus:ring-4 focus:ring-deep-teal/20 text-[#0D7377] dark:text-[#AEEF3C] font-black text-xl transition-all shadow-inner"
                              value={formData.maxMembers}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setFormData({...formData, maxMembers: isNaN(val) ? 2 : Math.min(100, Math.max(2, val))});
                              }}
                          />
                      </div>
                  </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                  <div className="flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-105">
                      <img 
                        src={theme === 'dark' ? logoWhite : logoGreen} 
                        alt="Adashi" 
                        className="w-48 h-auto object-contain" 
                      />
                  </div>
                  <h2 className="text-2xl font-black text-text-base mb-1 tracking-tight">Ready?</h2>
                  <p className="text-text-secondary text-sm font-medium italic">Review your configuration.</p>
              </div>

              <div className="bg-bg-base rounded-3xl p-6 space-y-4 shadow-sm">
                  <SummaryRow label="Name" value={formData.name} />
                  <SummaryRow label="Type" value={formData.isPublic ? 'Public' : 'Private'} />
                  <SummaryRow label="Model" value={formData.mode === 1 ? 'ROSCA' : 'Collective'} />
                  <SummaryRow label="Deposit" value={`${formData.deposit} STX`} />
                  <SummaryRow label="Cycle" value={`${formData.cycleDuration} Days`} />
                  
                  <div className="pt-4 flex items-start space-x-3 text-deep-teal dark:text-[#AEEF3C]/80">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-medium leading-relaxed italic">
                          Launching will create a smart contract interaction. Check your wallet for gas fees.
                      </p>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 flex justify-between">
          {step > 1 && (
              <button
                  onClick={prevStep}
                  className="px-6 py-3 text-text-tertiary font-bold uppercase tracking-widest hover:text-[#AEEF3C] transition-colors flex items-center space-x-2 text-xs active:scale-95"
              >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
              </button>
          )}
          
          <div className="flex-grow" />

          {step < totalSteps ? (
              <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-[#AEEF3C] text-navy rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center space-x-2 transform active:scale-95 shadow-lg shadow-[#AEEF3C]/20"
              >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
              </button>
          ) : (
              <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-[#AEEF3C] text-navy rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center space-x-2 transform active:scale-95 shadow-lg shadow-[#AEEF3C]/20 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Launch Group</span>
                    </>
                  )}
              </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SelectionCard({ active, onClick, title, icon, desc }: { active: boolean, onClick: () => void, title: string, icon: React.ReactNode, desc: string }) {
    return (
         <button
            onClick={onClick}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
                active 
                    ? 'bg-[#AEEF3C]/10 ring-4 ring-[#AEEF3C] text-navy dark:text-[#AEEF3C] shadow-md shadow-[#AEEF3C]/5' 
                    : 'bg-bg-base text-text-tertiary hover:bg-bg-tertiary'
            }`}
        >
            <div className={`p-3 rounded-xl mb-2 ${active ? 'bg-[#AEEF3C] text-navy' : 'bg-bg-base text-text-tertiary'}`}>
                {icon}
            </div>
            <h4 className="font-black text-xs uppercase tracking-widest mb-0.5">{title}</h4>
            <p className="text-[9px] font-bold italic">{desc}</p>
        </button>
    );
}

function SummaryRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black text-text-base tracking-tight">{value}</span>
        </div>
    );
}
