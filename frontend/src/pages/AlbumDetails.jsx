import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// NEW: Import burnSpark to charge the user!
import { getAlbumDetails, getAlbumPhotos, inviteToAlbum, deleteAlbum, burnSpark } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import PhotoGrid from '../components/photos/PhotoGrid';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderHeart, ArrowLeft, Loader2, Wand2, Sparkles, X, Play, Users, Trash2 } from 'lucide-react';
import MemoryStory from '../components/photos/MemoryStory';
// NEW: Import the modal so we can show it if they run out of Sparks
import LuminaModal from '../components/common/LuminaModal';

export default function AlbumDetails() {
  const { albumId } = useParams();
  // NEW: Grab userProfile to check their Sparks balance
  const { currentUser, userProfile } = useAuth();
  
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [vibeResult, setVibeResult] = useState('');
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  // NEW: State to trigger the Lumina Upgrade popup
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAlbumInfo() {
      try {
        const data = await getAlbumDetails(albumId);
        setAlbum(data);
        const photos = await getAlbumPhotos(currentUser.uid, albumId);
        setAlbumPhotos(photos);
      } catch (error) {
        console.error("Failed to load album details", error);
      } finally {
        setLoading(false);
      }
    }
    loadAlbumInfo();
  }, [albumId, refreshTrigger, currentUser]);

  // --- THE LUMINA ECONOMY INTEGRATION ---
  const handleSynthesize = async () => {
    // 1. THE PAYWALL CHECK: Do they have at least 1 Spark?
    if ((userProfile?.sparks || 0) < 1) {
      setIsUpgradeOpen(true); // Open the Razorpay popup!
      return; // Stop the function here
    }

    setIsSynthesizing(true);
    try {
      const photos = await getAlbumPhotos(currentUser.uid, albumId);

      if (photos.length === 0) {
        alert("Add some photos to this album first!");
        setIsSynthesizing(false);
        return;
      }

      // 2. THE BURN: Deduct 1 Spark from Firestore BEFORE calling the AI
      await burnSpark(currentUser.uid, 1);

      const allTags = photos.reduce((acc, photo) => {
        if (photo.tags) return [...acc, ...photo.tags];
        return acc;
      }, []);
      const uniqueTags = [...new Set(allTags)];

      const res = await fetch('https://smyora-backend.onrender.com/api/chat/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: uniqueTags, albumName: album.name })
      });

      const data = await res.json();
      setVibeResult(data.synthesis);

    } catch (error) {
      console.error("Failed to synthesize:", error);
      alert("The AI needs more inspiration, or network failed.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (window.confirm("Are you sure you want to delete this album? Your photos will NOT be deleted from your main gallery.")) {
      try {
        await deleteAlbum(albumId);
        navigate('/albums');
      } catch (error) {
        alert("Failed to delete album.");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : !album ? (
            <div className="text-white text-center py-20">Album not found.</div>
          ) : (
            <>
              {/* Header */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">

                {album.coverPhotoUrl && (
                  <div
                    className="absolute inset-0 opacity-20 blur-2xl scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${album.coverPhotoUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                  />
                )}

                <div className="relative z-10 w-full">
                  <Link to="/albums" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 text-sm w-fit mb-4">
                    <ArrowLeft size={16} /> Back to Albums
                  </Link>

                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-4 rounded-2xl border border-primary/30 shadow-lg shadow-primary/20">
                      <FolderHeart className="text-primary" size={28} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        {album.name}
                      </h1>

                      {album.isLiving ? (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                          Album is growing... Auto-pulling photos tagged with #{album.livingKeyword}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Your curated collection of memories.</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDeleteAlbum}
                  className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-4 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center"
                  title="Delete Album"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Users size={18} />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => {
                    if (albumPhotos.length === 0) return alert("Add some photos first!");
                    setIsStoryOpen(true);
                  }}
                  className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  <span>Play Memory</span>
                </button>

                {/* NEW: Updated Premium Button with Spark Cost Indicator */}
                <button
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                  className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSynthesizing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  <span>{isSynthesizing ? 'Reading...' : 'Synthesize Vibe'}</span>
                  {/* The Spark Cost Badge */}
                  <div className="flex items-center gap-1 bg-black/30 border border-white/10 px-2 py-0.5 rounded-lg text-xs font-bold text-yellow-400 ml-1">
                    <Sparkles size={12} fill="currentColor" /> 1
                  </div>
                </button>
              </header>

              {/* The Generated Poem Display */}
              <AnimatePresence>
                {vibeResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel border border-purple-500/30 p-8 rounded-2xl bg-purple-900/10 relative mt-4">
                      <button
                        onClick={() => setVibeResult('')}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <div className="flex flex-col items-center text-center">
                        <Sparkles className="text-purple-400 mb-4" size={28} />
                        <h3 className="text-xl font-bold text-white mb-6 font-serif tracking-wide">
                          Essence of "{album.name}"
                        </h3>
                        <div className="text-gray-200 text-lg md:text-xl leading-relaxed font-serif whitespace-pre-wrap">
                          {vibeResult}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <section>
                <PhotoGrid
                  refreshTrigger={refreshTrigger}
                  onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                  albumId={albumId}
                />
              </section>
            </>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {isStoryOpen && (
          <MemoryStory photos={albumPhotos} albumName={album?.name} onClose={() => setIsStoryOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInviteOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div className="glass-panel p-6 w-full max-w-md relative border border-primary/30">
              <button onClick={() => setIsInviteOpen(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-primary" /> Share Album
              </h2>
              <p className="text-gray-400 text-sm mb-6">Invite a friend to upload photos to this album in real-time.</p>
              <input
                type="email"
                placeholder="friend@email.com"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className="w-full bg-surface/50 border border-surfaceBorder rounded-lg py-3 px-4 text-white mb-4 outline-none focus:border-primary"
              />
              <button
                onClick={async () => {
                  await inviteToAlbum(albumId, friendEmail);
                  setIsInviteOpen(false);
                  alert("Invite Sent!");
                }}
                className="w-full bg-primary py-3 rounded-lg font-bold text-white hover:bg-indigo-500 transition-all"
              >
                Send Invite
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: Render the Lumina Modal if they hit the paywall */}
      <AnimatePresence>
        {isUpgradeOpen && <LuminaModal onClose={() => setIsUpgradeOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}