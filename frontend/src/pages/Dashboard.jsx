import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addPhotoRecord, deletePhotoRecord } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import UploadZone from '../components/photos/UploadZone';
import PhotoGrid from '../components/photos/PhotoGrid';
import MemoryHighlight from '../components/photos/MemoryHighlight';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, Bot, Loader2, History } from 'lucide-react';
import TimeMachine from '../components/photos/TimeMachine';
import MoodGallery from '../components/photos/MoodGallery';
import MemoryTriggers from '../components/photos/MemoryTriggers';
import MemoryChat from '../components/chat/MemoryChat';
import FuturePredictor from '../components/photos/FuturePredictor';
import Lightbox from '../components/photos/Lightbox';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTimeMachineMode, setIsTimeMachineMode] = useState(false);
  const [activeMood, setActiveMood] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadComplete = async (cloudinaryData, locationData) => {
    if (!currentUser) return;
    try {
      // Pass the new location parameter
      await addPhotoRecord(currentUser.uid, cloudinaryData, locationData);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  // NEW: The AI Submit Handler
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setActiveQuery('');
      setAiCaption('');
      return;
    }

    setIsAnalyzing(true);
    setAiCaption(''); // Clear old caption

    try {
      const res = await fetch('https://smyora-backend.onrender.com/api/chat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchInput })
      });

      const data = await res.json();

      // Pass the extracted tags to the grid (e.g., "dog beach")
      setActiveQuery(data.searchTags.join(' '));
      setAiCaption(data.caption);
    } catch (error) {
      console.error(error);
      // Fallback: If AI fails, just do a normal keyword search
      setActiveQuery(searchInput);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteFromDashboard = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;
    setIsDeleting(true);
    try {
      await deletePhotoRecord(photo.id);
      setSelectedPhoto(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert("Failed to delete photo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">
          <FuturePredictor />
          <header className="flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel p-4 px-6 rounded-2xl z-10 relative">

            {/* NEW: Transformed into a Form */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-2/3 lg:w-1/2">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ask AI: 'Show me my mountain trip and write a caption...'"
                className="w-full bg-surface/30 border border-surfaceBorder rounded-xl py-3 pl-10 pr-24 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-primary font-medium text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Enter
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsTimeMachineMode(!isTimeMachineMode)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 border ${isTimeMachineMode
                  ? 'bg-purple-600 border-purple-500 text-white shadow-purple-500/25'
                  : 'bg-surface/50 border-surfaceBorder hover:bg-surface text-gray-300'
                }`}
            >
              <History size={18} />
              <span className="whitespace-nowrap">{isTimeMachineMode ? 'Exit Time Machine' : 'Time Machine'}</span>
            </button>

            {/* <button className="bg-primary hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
              <Plus size={18} /><span>Upload</span>
            </button> */}
          </header>

          <section>
            {isTimeMachineMode ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TimeMachine refreshTrigger={refreshTrigger} />
              </motion.div>
            ) : (
              <>
                {/* NEW: AI Caption Banner */}
                <AnimatePresence>
                  {aiCaption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, mb: 0 }}
                      animate={{ opacity: 1, height: 'auto', mb: 24 }}
                      exit={{ opacity: 0, height: 0, mb: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-panel border border-primary/30 p-4 rounded-2xl bg-primary/5 flex items-start gap-4">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><Bot size={20} className="text-primary" /></div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">AI Assistant</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{aiCaption}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!activeQuery && <MemoryHighlight refreshTrigger={refreshTrigger} />}
                {!activeQuery && <UploadZone onUploadComplete={handleUploadComplete} />}

                <MemoryTriggers />
                <MoodGallery
                  activeMood={activeMood}
                  onMoodSelect={setActiveMood}
                />
                <PhotoGrid
                  refreshTrigger={refreshTrigger}
                  moodFilter={activeMood}
                  onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                  searchQuery={activeQuery}
                />
              </>
            )}
          </section>
        </motion.div>
        <MemoryChat onPhotoClick={(photo) => setSelectedPhoto(photo)} />

          <AnimatePresence>
          {selectedPhoto && (
            <Lightbox
              photo={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
              onDelete={() => handleDeleteFromDashboard(selectedPhoto)}
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}