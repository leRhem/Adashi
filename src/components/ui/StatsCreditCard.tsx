import { TrendingUp, Users, AlertCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import logoWhite from '../../assets/Logo - white.png';

interface StatsCreditCardProps {
  balance: number;
  activeGroups: number;
  pendingActions: number;
  totalReceived: number;
  userAddress?: string;
  onWithdraw: () => void;
}

export default function StatsCreditCard({
  balance,
  activeGroups,
  pendingActions,
  totalReceived,
  userAddress,
  onWithdraw
}: StatsCreditCardProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-[40px] bg-gradient-to-br from-[#0A1628] to-[#0D7377] text-white shadow-2xl transition-all hover:scale-[1.01] border border-white/5 group">
      {/* Abstract Background Design */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#AEEF3C] opacity-10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:opacity-20 transition-opacity duration-500"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#AEEF3C] opacity-5 rounded-full blur-[60px] -ml-10 -mb-10"></div>
      
      <div className="relative p-10">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-14">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-[#AEEF3C]" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black tracking-[0.2em] uppercase">Adashi Verified</p>
              <p className="text-sm font-mono text-white/80">{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Connected'}</p>
            </div>
          </div>
          <div className="flex items-center justify-center transition-transform group-hover:rotate-12">
             {/* Always use white logo since card has dark gradient background */}
             <img 
               src={logoWhite} 
               alt="Adashi Logo" 
               className="w-32 h-auto object-contain" 
             />
          </div>
        </div>

        {/* Main Balance Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-black uppercase tracking-widest">Available Balance</p>
            <div className="flex items-baseline space-x-3">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
                {balance.toLocaleString()}
              </h2>
              <span className="text-2xl font-black text-[#AEEF3C] tracking-tight">STX</span>
            </div>
          </div>

          <button 
            onClick={onWithdraw}
            className="flex items-center justify-center space-x-3 bg-[#AEEF3C] text-[#0A1628] px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#AEEF3C]/20 flex-shrink-0"
          >
            <span>Withdraw</span>
            <ArrowUpRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Grid Footer */}
        <div className="mt-14 pt-8 border-t border-white/5 grid grid-cols-3 gap-6">
          <FooterStat 
            icon={<Users className="w-5 h-5" />} 
            value={activeGroups.toString()} 
            label="Groups" 
            color="text-white"
          />
          <FooterStat 
            icon={<AlertCircle className="w-5 h-5" />} 
            value={pendingActions.toString()} 
            label="Pending" 
            color="text-[#AEEF3C]"
          />
          <FooterStat 
            icon={<TrendingUp className="w-5 h-5" />} 
            value={totalReceived.toLocaleString()} 
            label="Earned" 
            color="text-white"
          />
        </div>
      </div>
    </div>
  );
}

function FooterStat({ icon, value, label, color }: { icon: React.ReactNode, value: string, label: string, color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group/stat">
      <div className={`${color} mb-3 opacity-60 group-hover/stat:opacity-100 group-hover/stat:scale-110 transition-all`}>
        {icon}
      </div>
      <p className="text-xl font-black mb-0.5 tracking-tight">{value}</p>
      <p className="text-[10px] text-white/30 uppercase tracking-[0.1em] font-black">{label}</p>
    </div>
  );
}
