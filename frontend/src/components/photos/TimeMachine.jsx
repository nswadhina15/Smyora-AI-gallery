import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserPhotos } from '../../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Loader2, Image as ImageIcon } from 'lucide-react';
import Lightbox from './Lightbox';

export default function TimeMachine({ refreshTrigger }) {
  const { currentUser } = useAuth();
  const [groupedPhotos, setGroupedPhotos] = useState({});
  const [periods, setPeriods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    
    async function loadTimeline() {
      try {
        const photos = await getUserPhotos(currentUser.uid);
        
        // Group photos by YYYY-MM
        const groups = {};
        photos.forEach(photo => {
          if (!photo.createdAt) return;
          const date = photo.createdAt.toDate();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const key = `${year}-${month}`; // e.g., "2026-03"
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(photo);
        });

        // Sort chronologically (oldest to newest)
        const sortedPeriods = Object.keys(groups).sort((a, b) => a.localeCompare(b));
        
        setGroupedPhotos(groups);
        setPeriods(sortedPeriods);
        // Start the slider at the most recent memory (the end of the timeline)
        setCurrentIndex(sortedPeriods.length > 0 ? sortedPeriods.length - 1 : 0);
      } catch (e) {
        console.error("Failed to load timeline", e);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, [currentUser, refreshTrigger]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  if (periods.length === 0) {
    return (
      <div className="glass-panel p-10 text-center rounded-2xl border border-surfaceBorder">
        <History className="mx-auto text-gray-500 mb-4" size={40} />
        <h3 className="text-xl text-white font-medium">No timeline data yet</h3>
        <p className="text-gray-400 mt-2">Upload some photos to start building your time machine!</p>
      </div>
    );
  }

  const currentPeriod = periods[currentIndex];
  const displayPhotos = groupedPhotos[currentPeriod] || [];

  // Convert "2026-03" into a beautiful readable format "March 2026"
  const [yearStr, monthStr] = currentPeriod.split('-');
  const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
  const readableDate = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get start and end dates for the slider labels
  const startDate = new Date(periods[0].split('-')[0], periods[0].split('-')[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const endDate = new Date(periods[periods.length - 1].split('-')[0], periods[periods.length - 1].split('-')[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8">
      
      {/* 1. The Timeline Scrubber UI */}
      <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden shadow-2xl shadow-purple-900/20">
         {/* A beautiful glowing background orb */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

         <div className="relative z-10 flex flex-col items-center">
            <History className="text-purple-400 mb-3" size={32} />
            <h2 className="text-5xl font-serif text-white mb-8 tracking-wide drop-shadow-lg text-center">
              {readableDate}
            </h2>

            {/* The Actual Scrubber */}
            <input
              type="range"
              min="0"
              max={periods.length - 1}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
              className="w-full max-w-3xl h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            />

            <div className="flex justify-between w-full max-w-3xl text-xs text-gray-400 font-medium mt-4 uppercase tracking-wider">
              <span>{startDate}</span>
              <span className="text-purple-400 font-bold tracking-widest bg-purple-500/10 px-3 py-1 rounded-full">Time Machine Active</span>
              <span>{endDate}</span>
            </div>
         </div>
      </div>

      {/* 2. The Dynamic Grid */}
      <motion.div
        key={currentPeriod} // This magical line forces Framer Motion to animate whenever the date changes!
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {displayPhotos.map(photo => (
          <motion.div
            key={photo.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-xl overflow-hidden cursor-zoom-in relative group glass-panel border border-surfaceBorder/50 shadow-lg"
          >
            <img src={photo.url} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <ImageIcon className="text-white drop-shadow-md" size={32} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox for viewing */}
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => alert("Please delete from the main grid view.")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}