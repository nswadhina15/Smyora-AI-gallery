import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, FolderHeart, Star, LogOut, Settings as SettingsIcon, UploadCloud, Menu, X, MapPin, Lock, Sparkles, Users, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LuminaModal from '../common/LuminaModal';
import { assets } from '../../assets/assets';

export default function Sidebar() {
  const { currentUser, logout, userProfile } = useAuth();
  
  // State to track if the mobile menu is open
  const [isOpen, setIsOpen] = useState(false);
  
  // NEW: State to track if the Lumina Upgrade Modal is open
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const navItems = [
    { icon: <ImageIcon size={20} />, label: 'All Photos', path: '/' },
    { icon: <FolderHeart size={20} />, label: 'Albums', path: '/albums' },
    { icon: <MapPin size={20} />, label: 'Life Map', path: '/map' },
    { icon: <Star size={20} />, label: 'Favorites', path: '/favorites' },
    { icon: <Lock size={20} />, label: 'Private Vault', path: '/vault' },
    { icon: <Sparkles size={20} />, label: 'Smart Cleanup', path: '/cleanup' },
    { icon: <Users size={20} />, label: 'Tags', path: '/tags' },
    { icon: <LineChart size={20} />, label: 'Life Patterns', path: '/analytics' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="md:hidden fixed top-4 left-4 z-40 p-2 glass-panel text-white rounded-xl shadow-lg border border-surfaceBorder"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container (Responsive) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 p-6 flex flex-col glass-panel rounded-none border-y-0 border-l-0 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden absolute top-6 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-10 text-white mt-2 md:mt-0">
          <div className="shrink-0 rounded-xl shadow-lg shadow-primary/20">
            <img src={assets.logo} alt="Logo" className='w-11 rounded-xl' />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Smyora
            </h1>
            <p className="text-[11px] text-gray-400 mt-1 font-medium tracking-wide">
              Stories that stay with you.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-gray-400 hover:text-white hover:bg-surface'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-surfaceBorder flex flex-col gap-4">
          
          <div className="p-4 bg-gradient-to-br from-surface to-surface/40 border border-surfaceBorder rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-white font-bold text-sm flex items-center gap-1">
                <Sparkles size={14} className="text-yellow-400" /> Lumina
              </p>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">
                {userProfile?.sparks !== undefined ? userProfile.sparks : 5} Sparks left
              </p>
            </div>
            <button 
              onClick={() => setIsUpgradeOpen(true)}
              className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white hover:text-black transition-all shadow-md"
            >
              Upgrade
            </button>
          </div>

          {/* Existing User Profile display */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{currentUser?.email}</span>
              {/* Dynamically show their tier! */}
              <span className="text-xs text-gray-400 capitalize font-medium">
                {userProfile?.tier || 'Free'} Plan
              </span>
            </div>
          </div>
          
        </div>
      </aside>

      {/* NEW: This renders the popup on top of the app when isUpgradeOpen is true */}
      <AnimatePresence>
        {isUpgradeOpen && <LuminaModal onClose={() => setIsUpgradeOpen(false)} />}
      </AnimatePresence>
    </>
  );
}