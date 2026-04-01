import React, { useState, useEffect } from 'react';
import { getUserPhotos } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Lightbox from './Lightbox'; // We can reuse the Lightbox just to view the memories!

export default function MemoryHighlight({ refreshTrigger }) {
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    async function loadMemories() {
      try {
        const data = await getUserPhotos(currentUser.uid);
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();
        const currentYear = today.getFullYear();

        // Filter for photos matching today's month and day, but a previous year
        const onThisDay = data.filter(photo => {
          if (!photo.createdAt) return false;
          const photoDate = photo.createdAt.toDate();
          
          // NOTE FOR TESTING: 
          // If you want to see this UI right now with the photos you just uploaded today, 
          // temporarily change the `<` below to `<=` so it includes the current year!
          return (
            photoDate.getMonth() === currentMonth &&
            photoDate.getDate() === currentDay &&
            photoDate.getFullYear() < currentYear 
          );
        });

        setMemories(onThisDay);
      } catch (error) {
        console.error("Failed to load memories", error);
      }
    }
    loadMemories();
  }, [currentUser, refreshTrigger]);

  if (memories.length === 0) return null; // If no memories today, the component stays completely hidden

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20} />
          On This Day
        </h2>
        
        {/* Horizontal Scroll Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
          {memories.map((photo) => {
            const yearsAgo = new Date().getFullYear() - photo.createdAt.toDate().getFullYear();
            
            return (
              <div 
                key={photo.id} 
                onClick={() => setSelectedMemory(photo)}
                className="min-w-[200px] sm:min-w-[250px] relative rounded-2xl overflow-hidden glass-panel shrink-0 snap-start group cursor-zoom-in border border-surfaceBorder/50 hover:border-yellow-400/50 transition-all"
              >
                <img 
                  src={photo.url} 
                  alt="Memory" 
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                  <span className="text-white font-bold text-lg">
                    {yearsAgo === 0 ? 'Today' : `${yearsAgo} ${yearsAgo === 1 ? 'Year' : 'Years'} Ago`}
                  </span>
                  <span className="text-xs text-gray-300">
                    {photo.createdAt.toDate().getFullYear()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Reusing the Lightbox for an immersive viewing experience */}
      <AnimatePresence>
        {selectedMemory && (
          <Lightbox 
            photo={selectedMemory} 
            onClose={() => setSelectedMemory(null)} 
            // We disable delete/move inside the memory view to keep it simple and safe
            onDelete={() => alert("Please manage photos from the main grid.")} 
          />
        )}
      </AnimatePresence>
    </>
  );
}