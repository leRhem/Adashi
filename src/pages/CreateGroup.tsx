import { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Save, Coins, Users, 
  Clock, Globe, Lock, Shield, Info, Rocket 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 1, // 1: ROSCA, 2: Collective
    deposit: 100,
    maxMembers: 10,
    cycleDuration: 30, // days
    isPublic: true
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-3 text-gray-500 hover:text-gray-900 transition-colors group font-bold uppercase tracking-widest text-xs"
            >
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-gray-50">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Cancel</span>
            </button>

            <div className="flex items-center space-x-2">
                {[...Array(totalSteps)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-primary-600' : 'bg-gray-200'}`} 
                    />
                ))}
            </div>

            <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Step {step}/{totalSteps}</div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 p-12 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">The Basics</h2>
                    <p className="text-gray-500 font-medium italic">Give your group a name and identity.</p>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Group Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Dream Home Fund" 
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 font-bold transition-all text-xl"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                        <textarea 
                            rows={4}
                            placeholder="What is this group saving for? Who is it for?" 
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 font-medium transition-all"
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
                            desc="Discoverable by anyone"
                        />
                        <SelectionCard 
                            active={!formData.isPublic} 
                            onClick={() => setFormData({...formData, isPublic: false})}
                            title="Private"
                            icon={<Lock className="w-5 h-5" />}
                            desc="Invite-only access"
                        />
                    </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Financial Model</h2>
                    <p className="text-gray-500 font-medium italic">Configure how the savings will work.</p>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectionCard 
                            active={formData.mode === 1} 
                            onClick={() => setFormData({...formData, mode: 1})}
                            title="ROSCA"
                            icon={<Users className="w-5 h-5" />}
                            desc="Rotating Lump Sum Payouts"
                        />
                        <SelectionCard 
                            active={formData.mode === 2} 
                            onClick={() => setFormData({...formData, mode: 2})}
                            title="Collective"
                            icon={<Shield className="w-5 h-5" />}
                            desc="Shared Total Savings Pool"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center space-x-2">
                                <Coins className="w-3 h-3" />
                                <span>Deposit (STX)</span>
                            </label>
                            <input 
                                type="number" 
                                className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-primary-100 font-black text-2xl transition-all"
                                value={formData.deposit}
                                onChange={(e) => setFormData({...formData, deposit: Number(e.target.value)})}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>Cycle (Days)</span>
                            </label>
                            <input 
                                type="number" 
                                className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-primary-100 font-black text-2xl transition-all"
                                value={formData.cycleDuration}
                                onChange={(e) => setFormData({...formData, cycleDuration: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="text-center">
                    <div className="w-24 h-24 bg-primary-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <Rocket className="w-12 h-12 text-primary-600" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Ready for Launch?</h2>
                    <p className="text-gray-500 font-medium italic">Review your configuration before deploying to blockchain.</p>
                </div>

                <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100 space-y-6">
                    <SummaryRow label="Group Name" value={formData.name} />
                    <SummaryRow label="Type" value={formData.isPublic ? 'Public' : 'Private'} />
                    <SummaryRow label="Model" value={formData.mode === 1 ? 'Traditional ROSCA' : 'Collective Savings'} />
                    <SummaryRow label="Deposit" value={`${formData.deposit} STX`} />
                    <SummaryRow label="Cycle" value={`${formData.cycleDuration} Days`} />
                    
                    <div className="pt-6 border-t border-gray-200 flex items-start space-x-3 text-primary-700">
                        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-medium leading-relaxed italic">
                            Launching will create a smart contract interaction. Please ensure you have enough STX for the initial gas fee.
                        </p>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-16 pt-10 border-t border-gray-50 flex justify-between">
            {step > 1 && (
                <button
                    onClick={prevStep}
                    className="px-8 py-4 text-gray-400 font-black uppercase tracking-widest hover:text-gray-900 transition-colors flex items-center space-x-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
            )}
            
            <div className="flex-grow" />

            {step < totalSteps ? (
                <button
                    onClick={nextStep}
                    className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 group"
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <button
                    className="px-12 py-5 bg-primary-600 text-white rounded-3xl font-black shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center space-x-3 transform active:scale-95 group"
                >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Create Group</span>
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectionCard({ active, onClick, title, icon, desc }: { active: boolean, onClick: () => void, title: string, icon: React.ReactNode, desc: string }) {
    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-[32px] border-4 flex flex-col items-center justify-center text-center transition-all ${
                active 
                    ? 'bg-primary-50 border-primary-600 text-primary-900 shadow-xl shadow-primary-500/10' 
                    : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
            }`}
        >
            <div className={`p-4 rounded-2xl mb-4 ${active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {icon}
            </div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-1">{title}</h4>
            <p className="text-[10px] font-bold italic">{desc}</p>
        </button>
    );
}

function SummaryRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center px-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-lg font-black text-gray-900 tracking-tight">{value}</span>
        </div>
    );
}
