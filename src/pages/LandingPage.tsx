import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Wallet, Users, Search, UserPlus, TrendingUp, 
  Shield, Eye, Zap, Lock, Globe, BarChart, Vote, ArrowRight
} from 'lucide-react';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { connectWallet, isConnected } = useStacksConnect();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      connectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary-100 selection:text-primary-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(99,102,241,0.1)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-100 rounded-full blur-[100px] opacity-50 -z-10" />
        <div className="absolute top-60 -right-40 w-96 h-96 bg-purple-100 rounded-full blur-[120px] opacity-40 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-bold mb-8 shadow-sm border border-primary-100">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span>Save Together, Succeed Together</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
                Community Savings,
                <span className="block bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent italic">
                  Blockchain Powered.
                </span>
              </h1>

              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
                Join thousands saving together through ROSCAs and collective savings groups. Transparent, secure, and community-driven on the Stacks blockchain.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center justify-center space-x-3 transform active:scale-95 group"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{isConnected ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/browse')}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Browse Groups</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 pt-8 border-t border-gray-100 flex items-center space-x-12">
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tight">150+</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Active Groups</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tight">50K+</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">STX Pooled</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-[500px] flex items-center justify-center">
                {/* Floating Cards Animation */}
                {[
                  { color: 'primary', rot: -10, y: -40, z: 30, title: 'Summer Vacay Fund', members: 8, progress: 65, status: 'Active' },
                  { color: 'purple', rot: 5, y: 0, z: 20, title: 'Business Seed Fund', members: 12, progress: 40, status: 'Active' },
                  { color: 'emerald', rot: 15, y: 60, z: 10, title: 'Rainy Day Pool', members: 25, progress: 90, status: 'Completed' }
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [card.y, card.y - 20, card.y],
                      rotate: [card.rot, card.rot + 2, card.rot]
                    }}
                    transition={{ 
                      duration: 4 + i, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute w-72 bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 backdrop-blur-sm bg-white/90"
                    style={{ zIndex: card.z }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 bg-${card.color}-100 rounded-2xl flex items-center justify-center`}>
                        <Users className={`w-6 h-6 text-${card.color}-600`} />
                      </div>
                      <span className={`px-3 py-1 bg-${card.color === 'emerald' ? 'success' : card.color === 'purple' ? 'purple' : 'primary'}-100 text-${card.color === 'emerald' ? 'success' : card.color === 'purple' ? 'purple' : 'primary'}-700 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                        {card.status}
                      </span>
                    </div>
                    <h3 className="font-black text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">{card.members} Members</p>
                    
                    <div className="w-full bg-gray-50 rounded-full h-3 mb-2 border border-gray-100">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${card.color === 'primary' ? 'from-primary-500 to-primary-600' : card.color === 'purple' ? 'from-purple-500 to-purple-600' : 'from-emerald-500 to-emerald-600'}`} 
                        style={{ width: `${card.progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Progress</span>
                      <span>{card.progress}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              How It Works
            </h2>
            <p className="text-xl text-gray-500 font-medium">
              Three simple steps to start saving together with your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Search,
                title: 'Browse Groups',
                description: 'Discover public groups or create a private one for your friends. Choose the mode that fits your goals.',
                color: 'blue'
              },
              {
                icon: UserPlus,
                title: 'Join & Deposit',
                description: 'Lock in your spot with a single transaction. Make your periodic deposits easily through the app.',
                color: 'purple'
              },
              {
                icon: TrendingUp,
                title: 'Get Payouts',
                description: 'Receive lump sum payouts in ROSCA mode or withdraw your total savings in Collective mode.',
                color: 'emerald'
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="relative p-10 bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 group transition-all"
              >
                <div className={`w-20 h-20 bg-${step.color}-100 rounded-3xl flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform`}>
                  <step.icon className={`w-10 h-10 text-${step.color}-600`} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Built for Trust & Security
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Blockchain Secure', desc: 'Immutable records on Stacks' },
              { icon: Eye, title: 'Fully Transparent', desc: 'Track every STX in the pool' },
              { icon: Users, title: 'Community Driven', desc: 'Save with people you trust' },
              { icon: Zap, title: 'Automated Payouts', desc: 'Smart contracts handle the rest' },
              { icon: Lock, title: 'Safety Modes', desc: 'Varied risk levels for all' },
              { icon: Globe, title: 'Global Access', desc: 'Join groups from anywhere' },
              { icon: BarChart, title: 'Growth Options', desc: 'Earn stacking rewards soon' },
              { icon: Vote, title: 'Decentralized', desc: 'Community-led governance' }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-gray-50 hover:bg-white rounded-[32px] border border-transparent hover:border-primary-100 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">{feature.title}</h3>
                <p className="text-sm text-gray-500 font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto relative rounded-[60px] overflow-hidden bg-primary-600 p-12 md:p-24 text-center">
            {/* CTA Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-white/10 blur-[100px] rotate-45" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[140%] bg-purple-500/20 blur-[100px] -rotate-45" />
            </div>

            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black text-white mb-10 leading-tight"
            >
                Ready to Start Saving Together?
            </motion.h2>
            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto font-medium">
                Join the future of community finance and achieve your goals with CoopSave.
            </p>
            <button
                onClick={handleGetStarted}
                className="px-10 py-5 bg-white text-primary-600 rounded-[30px] font-black hover:bg-gray-100 transition-all shadow-2xl shadow-black/20 flex items-center justify-center space-x-3 mx-auto transform active:scale-95 group"
            >
                <Wallet className="w-6 h-6" />
                <span>{isConnected ? 'Go to Dashboard' : 'Connect Wallet & Get Started'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
          © 2026 CoopSave Platform • Built on Stacks Blockchain
        </div>
      </footer>
    </div>
  );
}
