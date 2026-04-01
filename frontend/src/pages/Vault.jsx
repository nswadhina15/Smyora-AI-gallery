import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkHasVault, setupVaultPin, verifyVaultPin, getVaultPhotos } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Delete, Loader2, Image as ImageIcon } from 'lucide-react';
import Lightbox from '../components/photos/Lightbox';

export default function Vault() {
  const { currentUser } = useAuth();
  const [hasVault, setHasVault] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // PIN Pad States
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Vault Content States
  const [vaultPhotos, setVaultPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    async function checkStatus() {
      const exists = await checkHasVault(currentUser.uid);
      setHasVault(exists);
      setLoading(false);
    }
    checkStatus();
  }, [currentUser]);

  useEffect(() => {
    if (!isUnlocked) return;
    async function loadVault() {
      const photos = await getVaultPhotos(currentUser.uid);
      setVaultPhotos(photos);
    }
    loadVault();
  }, [isUnlocked, currentUser, refreshTrigger]);

  // Handle PIN entry automatically when 4 digits are reached
  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handlePinSubmit = async () => {
    if (isSettingUp || !hasVault) {
      // User is creating a new PIN
      await setupVaultPin(currentUser.uid, pin);
      setHasVault(true);
      setIsUnlocked(true);
      setPin('');
    } else {
      // User is trying to unlock
      const isValid = await verifyVaultPin(currentUser.uid, pin);
      if (isValid) {
        setIsUnlocked(true);
        setPin('');
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setVaultPhotos([]); // Clear memory for security
  };

  if (loading) return <div className="min-h-screen flex bg-background items-center justify-center"><Loader2 className="animate-spin text-red-500" size={40} /></div>;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative flex flex-col items-center justify-center">
        
        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            // --- THE PIN PAD ---
            <motion.div 
              key="pinpad"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel p-8 md:p-12 rounded-3xl border border-red-500/30 flex flex-col items-center max-w-sm w-full shadow-2xl shadow-red-900/20"
            >
              <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30 mb-6">
                <Lock className="text-red-400" size={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Private Vault</h2>
              <p className="text-gray-400 text-sm text-center mb-8">
                {!hasVault ? "Create a 4-digit PIN to secure your hidden photos." : "Enter your PIN to access hidden photos."}
              </p>

              {/* PIN Dots Display */}
              <div className="flex gap-4 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-red-500 border-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'border-gray-600 bg-transparent'}`} />
                ))}
              </div>

              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mb-4 font-medium">{error}</motion.p>}

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handleNumberClick(num.toString())} className="h-16 rounded-2xl bg-surface/50 border border-surfaceBorder hover:bg-surface text-2xl font-medium text-white transition-colors">
                    {num}
                  </button>
                ))}
                <div /> {/* Empty space bottom left */}
                <button onClick={() => handleNumberClick('0')} className="h-16 rounded-2xl bg-surface/50 border border-surfaceBorder hover:bg-surface text-2xl font-medium text-white transition-colors">0</button>
                <button onClick={handleDelete} className="h-16 rounded-2xl bg-surface/50 border border-surfaceBorder hover:bg-surface text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                  <Delete size={24} />
                </button>
              </div>
            </motion.div>
          ) : (
            
            // --- THE UNLOCKED VAULT CONTENT ---
            <motion.div key="vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl mx-auto space-y-8 h-full">
              <header className="flex justify-between items-center glass-panel p-6 rounded-2xl border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                    <ShieldCheck className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Private Vault</h1>
                    <p className="text-red-400/80 text-sm mt-1">These photos are hidden from your main timeline.</p>
                  </div>
                </div>
                <button onClick={lockVault} className="bg-surface hover:bg-red-500/20 border border-surfaceBorder hover:border-red-500/50 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2">
                  <Lock size={18} /> Lock Vault
                </button>
              </header>

              {vaultPhotos.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-red-500/30 rounded-2xl glass-panel">
                  <ShieldCheck size={48} className="mx-auto mb-4 text-red-500/50" />
                  <p className="text-lg text-white mb-2">Your vault is empty</p>
                  <p className="text-sm">Go to your main timeline and click the Lock icon on any photo to move it here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vaultPhotos.map(photo => (
                    <motion.div key={photo.id} whileHover={{ scale: 1.02 }} onClick={() => setSelectedPhoto(photo)} className="aspect-square rounded-xl overflow-hidden cursor-zoom-in relative group glass-panel border border-red-500/30 shadow-lg">
                      <img src={photo.url} alt="Hidden Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[2px] hover:blur-none" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ImageIcon className="text-white drop-shadow-md" size={32} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox for Vault */}
        <AnimatePresence>
          {selectedPhoto && (
            <Lightbox 
              photo={selectedPhoto} 
              onClose={() => {
                setSelectedPhoto(null);
                setRefreshTrigger(prev => prev + 1); // Refresh vault when lightbox closes in case they un-vaulted it
              }} 
            />
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}