import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, LogOut, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { currentUser, logout, resetPassword, deleteAccount } = useAuth();
  
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setIsResetting(true);
    setError('');
    setResetMessage('');

    try {
      await resetPassword(currentUser.email);
      setResetMessage('Reset link sent! Check your inbox.');
    } catch (err) {
      console.error(err);
      setError('Failed to send reset email.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Add an extra layer of friction so they don't accidentally click it
    if (window.confirm("WARNING: Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteAccount();
        // Firebase will automatically log them out and redirect to login if successful
      } catch (err) {
        console.error("Delete Error:", err);
        // Firebase security rule: You must have logged in recently to delete an account
        if (err.code === 'auth/requires-recent-login') {
          alert("For security reasons, please log out and log back in before deleting your account.");
        } else {
          alert("Failed to delete account. Please try again later.");
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 relative pt-20 md:pt-8"> 
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
          
          <header className="flex items-center gap-3 glass-panel p-6 rounded-2xl">
            <div className="bg-gray-500/20 p-3 rounded-xl border border-gray-500/30">
              <SettingsIcon className="text-gray-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Account Settings</h1>
              <p className="text-gray-400 text-sm mt-1">Manage your profile and preferences.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Profile Section */}
              <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <User size={18} className="text-primary" /> Profile Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      disabled 
                      value={currentUser?.email || ''} 
                      className="w-full bg-surface/30 border border-surfaceBorder rounded-xl py-2 px-4 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Account ID</label>
                    <input 
                      type="text" 
                      disabled 
                      value={currentUser?.uid || ''} 
                      className="w-full bg-surface/30 border border-surfaceBorder rounded-xl py-2 px-4 text-gray-400 font-mono text-xs cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-emerald-400" /> Security
                </h2>
                <p className="text-sm text-gray-400 mb-4">Your account is secured by Google Firebase Authentication. You can request a secure password reset link to your registered email below.</p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button 
                    onClick={handlePasswordReset}
                    disabled={isResetting || resetMessage}
                    className="px-5 py-2.5 bg-surface hover:bg-surface/80 border border-surfaceBorder rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting && <Loader2 size={16} className="animate-spin" />}
                    {resetMessage ? 'Check Email' : 'Change Password'}
                  </button>

                  <AnimatePresence>
                    {resetMessage && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle size={16} /> {resetMessage}
                      </motion.div>
                    )}
                    {error && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={16} /> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className="glass-panel p-6 rounded-2xl border-red-500/30 bg-red-500/5">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} /> Danger Zone
                </h2>
                <p className="text-sm text-gray-400 mb-4">Permanently delete your account. This will immediately revoke your access to the platform.</p>
                
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete Account'}
                </button>
              </div>

            </div>

            {/* Sidebar Actions Column */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg">
                  {currentUser?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <h3 className="text-white font-medium truncate w-full">{currentUser?.email}</h3>
                <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-semibold px-3 py-1 rounded-full mt-3 shadow-sm">
                  Pro Plan 
                </span>
                
                <hr className="w-full border-surfaceBorder my-6" />
                
                <button 
                  onClick={logout}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all font-medium"
                >
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </main>
    </div>
  );
}