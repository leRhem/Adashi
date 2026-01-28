import { useNavigate } from 'react-router-dom';
import {
  Wallet, Users, TrendingUp,
  Shield, Zap, ArrowRight
} from 'lucide-react';
import { useStacksConnect } from '../hooks/useStacksConnect';
import { motion } from 'framer-motion';
import LightRays from '../components/ui/LightRays';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected, connectWallet } = useStacksConnect();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      connectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-bg-base overflow-hidden transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
        {/* Animated Background: LightRays */}
        <LightRays 
          raysOrigin="top-center"
          raysColor="#AEEF3C"
          raysSpeed={1}
          rayLength={1}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
        
        {/* Additional Depth Elements */}
        {/* <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-deep-teal/5 rounded-full blur-[120px] -mr-64 -mt-32" /> */}

        <div className="max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-deep-teal/10 rounded-full text-deep-teal dark:text-electric-lime text-xs font-black uppercase tracking-widest mb-8 shadow-sm"
            >
              <Zap className="w-3 h-3" />
              <span>The Future of Community Savings</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-text-base tracking-tighter mb-8 leading-[1.1]"
            >
              Save <span className="text-transparent bg-clip-text bg-gradient-to-r from-deep-teal to-electric-lime">Together</span>, <br />
              Grow Faster.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-text-secondary font-medium mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Adashi brings traditional cooperative savings (ROSCA) to the blockchain. Build trust, save collectively, and unlock financial opportunities with your community.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-10 py-5 bg-electric-lime text-navy rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-electric-lime/20 flex items-center justify-center space-x-3 active:scale-95 group"
              >
                <Wallet className="w-6 h-6" />
                <span>{isConnected ? 'Go to Dashboard' : 'Get Started Now'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/browse')}
                className="w-full sm:w-auto px-10 py-5 bg-bg-secondary text-text-base rounded-2xl font-black text-lg hover:bg-bg-tertiary transition-all active:scale-95 shadow-lg"
              >
                Browse Groups
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-bg-secondary/50 transition-colors duration-300 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <StatCard value="150+" label="Active Groups" />
                  <StatCard value="50K+" label="STX Pooled" />
                  <StatCard value="2.5K+" label="Total Savers" />
                  <StatCard value="100%" label="On-Chain Secure" />
              </div>
          </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-text-base mb-6 tracking-tight">
              Built for Trust & Security
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-deep-teal" />}
              title="Secure Smart Contracts"
              desc="Your savings are governed by immutable Stacks smart contracts, ensuring total transparency."
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-electric-lime" />}
              title="Community Trust"
              desc="Join groups with family and friends. Adashi digitizes traditional social banking models."
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10 text-deep-teal" />}
              title="Automated Yield"
              desc="The collective power of the pool opens doors to shared growth and financial opportunities."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto relative rounded-[60px] overflow-hidden bg-deep-teal p-12 md:p-24 text-center shadow-2xl shadow-deep-teal/20">
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-white/10 blur-[100px] rotate-45" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[140%] bg-electric-lime/20 blur-[100px] -rotate-45" />
            </div>

            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black text-white mb-10 leading-tight"
            >
                Ready to Start Saving Together?
            </motion.h2>
            <button
                onClick={handleGetStarted}
                className="px-10 py-5 bg-electric-lime text-navy rounded-[30px] font-black hover:scale-105 transition-all shadow-2xl shadow-black/20 flex items-center justify-center space-x-3 mx-auto transform active:scale-95 group"
            >
                <Wallet className="w-6 h-6" />
                <span>{isConnected ? 'Go to Dashboard' : 'Connect Wallet & Get Started'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-bg-base transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-text-tertiary font-black text-xs uppercase tracking-widest">
          © 2026 Adashi • Built on Stacks Blockchain
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center group cursor-default">
            <div className="text-4xl md:text-5xl font-black text-text-base mb-2 group-hover:text-deep-teal transition-colors tracking-tighter">{value}</div>
            <div className="text-xs font-black text-text-tertiary uppercase tracking-[0.2em]">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-10 bg-bg-secondary rounded-[40px] shadow-lg hover:shadow-2xl hover:shadow-deep-teal/10 transition-all group backdrop-blur-sm">
      <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-text-base mb-4 tracking-tight">{title}</h3>
      <p className="text-text-secondary font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
