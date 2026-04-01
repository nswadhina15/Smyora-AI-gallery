import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createAlbum, getUserAlbums } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
// Added Zap for the Living Album icon
import { FolderHeart, Plus, X, Loader2, Image as ImageIcon, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Albums() {
  const { currentUser } = useAuth();
  
  // 1. Move useLocation UP here so we can read the AI state immediately
  const location = useLocation();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // 2. Catch the incoming AI prediction data (or default to empty if navigating normally)
  const [isModalOpen, setIsModalOpen] = useState(location.state?.openCreateModal || false);
  const [newAlbumName, setNewAlbumName] = useState(location.state?.suggestedName || '');
  const [isLiving, setIsLiving] = useState(location.state?.isLiving || false);
  const [livingKeyword, setLivingKeyword] = useState(location.state?.suggestedKeyword || '');

  useEffect(() => {
    if (!currentUser) return;
    async function loadAlbums() {
      try {
        const data = await getUserAlbums(currentUser.uid);
        setAlbums(data);
      } catch (error) {
        console.error("Failed to load albums", error);
      } finally {
        setLoading(false);
      }
    }
    loadAlbums();
  }, [currentUser]);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    
    // Safety check: If it's a living album, they must provide a keyword
    if (isLiving && !livingKeyword.trim()) {
      return alert("Please enter a keyword for the Living Album (e.g., 'beach', 'dog').");
    }

    setIsCreating(true);
    try {
      // Pass the living album parameters to your database function
      const newAlbum = await createAlbum(currentUser.uid, newAlbumName.trim(), isLiving, livingKeyword.trim());
      
      // Optimistically add to UI
      setAlbums(prev => [...prev, newAlbum].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Reset Modal and States
      setNewAlbumName('');
      setIsLiving(false);
      setLivingKeyword('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create album", error);
    } finally {
      setIsCreating(false);
    }
  };

  

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <header className="flex justify-between items-center glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                <FolderHeart className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Your Albums</h1>
                <p className="text-gray-400 text-sm mt-1">Organize your memories into collections.</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={18} /> <span className="hidden sm:block">New Album</span>
            </button>
          </header>

          {/* Albums Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : albums.length === 0 ? (
            <div className="text-center py-20 text-gray-500 border-2 border-dashed border-surfaceBorder rounded-2xl mt-8 glass-panel cursor-pointer hover:bg-surface/10 transition-colors" onClick={() => setIsModalOpen(true)}>
              <FolderHeart size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-lg text-white mb-2">No albums yet</p>
              <p className="text-sm">Click here to create your first album.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {albums.map((album) => (
                <Link to={`/albums/${album.id}`} key={album.id}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-primary/50 transition-all group relative"
                  >
                    
                    {/* NEW: Living Album Badge */}
                    {album.isLiving && (
                      <div className="absolute top-6 right-6 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-400/30 flex items-center gap-1 shadow-lg">
                        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Living</span>
                      </div>
                    )}

                    <div className="aspect-square rounded-xl bg-surface/50 mb-4 flex items-center justify-center overflow-hidden relative">
                      {album.coverPhotoUrl ? (
                        <img src={album.coverPhotoUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ImageIcon size={40} className="text-gray-600" />
                      )}
                    </div>
                    <h3 className="text-white font-semibold text-lg truncate">{album.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {album.isLiving ? `Auto-pulls: #${album.livingKeyword}` : 'Standard Collection'}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Album Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel p-6 w-full max-w-md relative border border-surfaceBorder/50"
              >
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                <h2 className="text-2xl font-bold text-white mb-6">Create New Album</h2>
                
                <form onSubmit={handleCreateAlbum}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Album Name</label>
                      <input
                        type="text"
                        autoFocus
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        placeholder="e.g., Summer Trip 2026"
                        className="w-full bg-surface/50 border border-surfaceBorder rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    {/* NEW: Living Album Toggle UI */}
                    <div className="bg-surface/30 p-4 rounded-xl border border-surfaceBorder flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={18} className={isLiving ? "text-yellow-400" : "text-gray-500"} />
                          <div>
                            <span className="text-white font-medium block">Living Album</span>
                            <span className="text-xs text-gray-400">Auto-add photos based on AI tags</span>
                          </div>
                        </div>
                        {/* Custom Animated Toggle Switch */}
                        <div 
                          onClick={() => setIsLiving(!isLiving)} 
                          className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${isLiving ? 'bg-yellow-400' : 'bg-surfaceBorder'}`}
                        >
                          <motion.div 
                            layout 
                            transition={{ type: "spring", stiffness: 500, damping: 30 }} 
                            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md" 
                            style={{ x: isLiving ? 24 : 0 }} 
                          />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isLiving && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }} 
                            className="overflow-hidden"
                          >
                            <input 
                              type="text" 
                              value={livingKeyword} 
                              onChange={(e) => setLivingKeyword(e.target.value)} 
                              placeholder="Enter one AI tag (e.g., 'dog', 'beach')" 
                              className="w-full bg-surface/50 border border-yellow-400/30 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm mt-2" 
                              required={isLiving} 
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={isCreating}
                    className="w-full bg-primary hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
                  >
                    {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create Album'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}