import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Menu, Copy, ExternalLink, LogOut, User, ChevronDown } from 'lucide-react';
import { useStacksConnect } from '../../hooks/useStacksConnect';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import logoGreen from '../../assets/Logo - green.png';
import logoWhite from '../../assets/Logo - white.png';

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <RouterNavLink
      to={to}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
        active 
          ? 'bg-[#AEEF3C] text-[#0A1628] shadow-lg shadow-[#AEEF3C]/10' 
          : 'text-text-base/70 hover:text-text-base hover:bg-white/5'
      }`}
    >
      {label}
    </RouterNavLink>
  );
}

export default function Header() {
  const { isConnected, userAddress, connectWallet, disconnect } = useStacksConnect();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Calculate progress for transitions (0 to 1 over 100px)
      const progress = Math.min(scrollY / 100, 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userAddress);
  };

  return (
    <header 
      className="fixed left-0 right-0 z-50 px-4 pointer-events-none transition-all duration-300"
      style={{ 
        top: `${24 - scrollProgress * 12}px`,
        opacity: 0.8 + scrollProgress * 0.2
      }}
    >
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div 
          className="flex justify-between items-center bg-bg-secondary/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all duration-300"
          style={{ 
            height: `${64 - scrollProgress * 8}px`,
            paddingLeft: `${32 - scrollProgress * 4}px`,
            paddingRight: `${32 - scrollProgress * 4}px`,
            backgroundColor: `rgba(var(--bg-secondary-rgb), ${0.4 + scrollProgress * 0.4})`,
            scale: 1 - scrollProgress * 0.02
          }}
        >
          {/* Logo & Brand */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center group cursor-pointer"
          >
            <div className="flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src={theme === 'dark' ? logoWhite : logoGreen} 
                alt="Adashi Logo" 
                className="w-28 h-auto object-contain" 
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/browse" label="Browse Groups" active={location.pathname === '/browse'} />
            <NavLink to="/dashboard" label="Dashboard" active={location.pathname === '/dashboard'} />
            
            <div className="ml-4 pl-4 border-l border-white/10 flex items-center space-x-4">
              <ThemeToggle />
              
              {isConnected ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 p-1.5 pr-4 rounded-2xl transition-all"
                  >
                    <div className="w-8 h-8 bg-deep-teal rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] font-bold text-success-500 uppercase tracking-widest leading-none">Connected</span>
                      <span className="text-xs font-mono text-text-base/60 leading-tight">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-base/40 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-bg-secondary rounded-[24px] shadow-2xl py-2 z-50 animate-slide-in">
                      <button
                        onClick={() => {
                          handleCopyAddress();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-text-base/70 hover:text-text-base hover:bg-white/5 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </button>
                      <a
                        href={`https://explorer.stacks.co/address/${userAddress}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-text-base/70 hover:text-text-base hover:bg-white/5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on Explorer</span>
                      </a>
                      <div className="my-2 h-px bg-white/5 mx-4" />
                      <button
                        onClick={() => {
                          disconnect();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-6 py-2.5 bg-[#AEEF3C] text-[#0A1628] rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#AEEF3C]/20 flex items-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2.5 bg-white/5 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mt-2 md:hidden bg-bg-secondary/90 backdrop-blur-xl p-4 space-y-2 animate-slide-in shadow-xl rounded-[32px] border border-white/10">
            <RouterNavLink to="/browse" className="block px-6 py-4 rounded-2xl bg-white/5 text-white font-bold">Browse Groups</RouterNavLink>
            <RouterNavLink to="/dashboard" className="block px-6 py-4 rounded-2xl bg-white/5 text-white font-bold">Dashboard</RouterNavLink>
            {!isConnected && (
              <button
                onClick={connectWallet}
                className="w-full px-6 py-4 bg-[#AEEF3C] text-[#0A1628] rounded-2xl font-bold flex items-center justify-center space-x-2"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </button>
            )}
            <div className="pt-2 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
