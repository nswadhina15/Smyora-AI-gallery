import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function MemoryStory({ photos, albumName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Emotional phrases to overlay
  const phrases = [
    "A day you'll never forget...",
    "Moments that matter...",
    "Glimpses of joy...",
    "Time stands still...",
    "Beautiful memories...",
    "Just like it was yesterday..."
  ];

  // 5 seconds per photo
  const STORY_DURATION = 5000; 

  useEffect(() => {
    let timer;
    if (isPlaying && hasStarted) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === photos.length - 1) {
            clearInterval(timer);
            setTimeout(onClose, 1000); // Close after the last photo finishes
            return prev;
          }
          return prev + 1;
        });
      }, STORY_DURATION);
    }
    return () => clearInterval(timer);
  }, [currentIndex, isPlaying, hasStarted, photos.length, onClose]);

  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
  };

  if (!photos || photos.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-sans"
    >
      {/* Background Audio (Royalty free placeholder link - you can change this later!) */}
      {hasStarted && (
        <audio 
          src="https://cdn.pixabay.com/download/audio/2022/05/16/audio_903102c4cb.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />
      )}

      {!hasStarted ? (
        // Start Screen
        <div className="text-center z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel p-8 rounded-3xl flex flex-col items-center">
            <h2 className="text-3xl font-serif text-white mb-2 pb-2">"{albumName}"</h2>
            <p className="text-gray-400 mb-8">A cinematic memory</p>
            <button onClick={handleStart} className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              <Play size={20} fill="currentColor" /> Play Story
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Top Progress Bars (Instagram Style) */}
          <div className="absolute top-4 left-4 right-4 z-50 flex gap-2">
            {photos.map((_, i) => (
              <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
                {i === currentIndex && isPlaying && (
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: '100%' }} 
                    transition={{ duration: STORY_DURATION / 1000, ease: "linear" }}
                    className="h-full bg-white"
                  />
                )}
                {i < currentIndex && <div className="h-full w-full bg-white" />}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="absolute top-10 right-4 z-50 flex gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className="text-white drop-shadow-lg p-2 bg-black/20 rounded-full backdrop-blur-md">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white drop-shadow-lg p-2 bg-black/20 rounded-full backdrop-blur-md">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={onClose} className="text-white drop-shadow-lg p-2 bg-black/20 rounded-full backdrop-blur-md hover:bg-red-500/50 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Cinematic Image Viewer */}
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} className="absolute inset-0 flex items-center justify-center">
              
              {/* The Ken Burns Zoom Effect */}
              <motion.img 
                src={photos[currentIndex].url} 
                alt="Memory"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.15, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                transition={{ duration: STORY_DURATION / 1000, ease: "linear" }}
                className="w-full h-full object-cover"
              />
              
              {/* Dramatic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Animated Text Overlay */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-20 left-8 right-8 text-center"
              >
                <h3 className="text-white font-serif text-3xl md:text-5xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wide">
                  {phrases[currentIndex % phrases.length]}
                </h3>
                <p className="text-white/70 text-sm md:text-base mt-4 tracking-widest uppercase">
                  {photos[currentIndex].createdAt?.toDate().getFullYear() || ''}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}