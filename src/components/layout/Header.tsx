import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Coins, Wallet, Menu, Copy, ExternalLink, LogOut, User } from 'lucide-react';
import { useStacksConnect } from '../../hooks/useStacksConnect';
import { formatAddress } from '../../utils/format';

export default function Header() {
  const { isConnected, userAddress, connectWallet, disconnect } = useStacksConnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              CoopSave
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            <NavOption to="/dashboard">Dashboard</NavOption>
            <NavOption to="/browse">Browse Groups</NavOption>
            <NavOption to="/create">Create Group</NavOption>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Address */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700 font-mono">
                    {formatAddress(userAddress)}
                  </span>
                </div>
                
                {/* User Dropdown */}
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                    <User className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                     <button
                        onClick={() => {
                          navigator.clipboard.writeText(userAddress);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </button>
                      <a
                        href={`https://explorer.stacks.co/address/${userAddress}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on Explorer</span>
                      </a>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={disconnect}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 transform active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
          <NavLink to="/dashboard" className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Dashboard</NavLink>
          <NavLink to="/browse" className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Browse Groups</NavLink>
          <NavLink to="/create" className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Create Group</NavLink>
        </div>
      )}
    </header>
  );
}

function NavOption({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 scale-105 shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
