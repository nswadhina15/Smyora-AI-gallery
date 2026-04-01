import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Download, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { addPhotoRecord, burnSpark } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
// NEW: Import the Lumina Modal!
import LuminaModal from '../common/LuminaModal';

const DIMENSIONS = [
  { id: 'anime', name: 'Anime World', prompt: 'in the style of a makoto shinkai anime movie, vibrant colors, beautiful anime sky', icon: '🌸', color: 'from-pink-500 to-rose-400' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', prompt: 'neon lights, cyberpunk city, dark futuristic sci-fi, glowing accents', icon: '🌃', color: 'from-cyan-500 to-blue-600' },
  { id: 'ghibli', name: 'Studio Ghibli', prompt: 'studio ghibli style, watercolor background, lush green nature, whimsical', icon: '🍃', color: 'from-emerald-400 to-teal-500' },
  { id: 'night', name: 'Midnight', prompt: 'nighttime, moonlit, dark starry sky, glowing ambient light', icon: '🌙', color: 'from-indigo-600 to-purple-800' },
  { id: 'sketch', name: 'Pencil Sketch', prompt: 'detailed pencil sketch, highly detailed graphite drawing', icon: '✏️', color: 'from-gray-500 to-gray-700' }
];

export default function AltRealityStudio({ photo, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [selectedDim, setSelectedDim] = useState(null);
  const [isWarping, setIsWarping] = useState(false);
  const [warpedPhotoUrl, setWarpedPhotoUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // NEW: State to trigger the Lumina Upgrade popup
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const handleWarpReality = async () => {
    if (!selectedDim) return;
    
    // THE PAYWALL CHECK
    if ((userProfile?.sparks || 0) < 1) {
      setIsUpgradeOpen(true); // Open the Lumina Modal instead of an alert!
      return;
    }

    setIsWarping(true);

    try {
      // 1. Burn 1 Spark from their account first
      await burnSpark(currentUser.uid, 1);

      // 2. Proceed with the Cloudinary AI generation as normal
      const safePrompt = selectedDim.prompt.replace(/,/g, ''); 
      const formattedPrompt = encodeURIComponent(safePrompt);
      const newUrl = photo.url.replace('/upload/', `/upload/e_gen_background_replace:prompt_${formattedPrompt}/`);
      
      setTimeout(() => {
        setWarpedPhotoUrl(newUrl);
        setIsWarping(false);
      }, 4000);

    } catch (error) {
      console.error("Warp failed:", error);
      alert(error.message || "Failed to warp reality.");
      setIsWarping(false);
    }
  };

  const saveToGallery = async () => {
    setIsSaving(true);
    try {
      // Fake a Cloudinary upload response object based on the new URL
      const fakeCloudinaryData = {
        secure_url: warpedPhotoUrl,
        public_id: `${photo.publicId}_alt_${selectedDim.id}`,
        format: photo.format,
        width: photo.width,
        height: photo.height,
        tags: [...(photo.tags || []), 'alt-reality', selectedDim.id]
      };

      await addPhotoRecord(currentUser.uid, fakeCloudinaryData, photo.location);
      alert("Alt Reality saved to your gallery!");
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 sm:p-8"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-surface/50 p-2 rounded-full backdrop-blur-md z-[70]">
        <X size={24} />
      </button>

      <div className="max-w-6xl w-full h-full max-h-[800px] flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Original Image / Warped Image */}
        <div className="flex-1 flex flex-col items-center justify-center relative rounded-3xl overflow-hidden border border-surfaceBorder bg-surface/20">
          <AnimatePresence mode="wait">
            {isWarping ? (
              <motion.div key="warping" className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                <div className="w-32 h-32 relative flex items-center justify-center mb-8">
                  <div className="absolute inset-0 border-4 border-t-purple-500 border-r-blue-500 border-b-emerald-500 border-l-pink-500 rounded-full animate-spin"></div>
                  <Zap size={40} className="text-white animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse">
                  Tearing the fabric of reality...
                </h2>
                <p className="text-gray-400 mt-2">Connecting to the {selectedDim?.name} dimension.</p>
              </motion.div>
            ) : warpedPhotoUrl ? (
              <motion.img 
                key="warped"
                initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }}
                src={warpedPhotoUrl} 
                className="w-full h-full object-contain shadow-2xl shadow-purple-500/20"
              />
            ) : (
              <motion.img 
                key="original"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                src={photo.url} 
                className="w-full h-full object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
              />
            )}
          </AnimatePresence>

          {/* Before/After Toggle Badge */}
          {warpedPhotoUrl && !isWarping && (
             <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-sm font-bold flex items-center gap-2 shadow-lg z-20">
               <Sparkles size={16} className="text-purple-400" /> Reality: {selectedDim?.name}
             </div>
          )}
        </div>

        {/* Right Side: Controls */}
        <div className="w-full md:w-[400px] flex flex-col justify-between py-4 z-10">
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Alt Reality</h1>
              <p className="text-gray-400 text-sm">Select a dimension to transform your memory into a completely different reality.</p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {DIMENSIONS.map((dim) => (
                <button
                  key={dim.id}
                  onClick={() => { setSelectedDim(dim); setWarpedPhotoUrl(null); }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                    selectedDim?.id === dim.id 
                      ? `border-transparent bg-gradient-to-r ${dim.color} shadow-lg shadow-purple-500/25` 
                      : 'border-surfaceBorder bg-surface/30 hover:bg-surface hover:border-gray-500'
                  }`}
                >
                  <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{dim.icon}</div>
                  <div>
                    <h3 className={`font-bold ${selectedDim?.id === dim.id ? 'text-white' : 'text-gray-200'}`}>{dim.name}</h3>
                    <p className={`text-xs ${selectedDim?.id === dim.id ? 'text-white/80' : 'text-gray-500'}`}>Tap to preview connection</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {!warpedPhotoUrl ? (
              <button
                onClick={handleWarpReality}
                disabled={!selectedDim || isWarping}
                className="w-full bg-white hover:bg-gray-200 text-black font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap fill="currentColor" size={20} /> Warp Reality
                {/* LUMINA COST BADGE */}
                {selectedDim && !isWarping && (
                  <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg text-xs font-black text-black/70 ml-2 border border-black/10">
                    <Sparkles size={12} fill="currentColor" /> 1
                  </div>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setWarpedPhotoUrl(null)}
                  className="flex-1 bg-surface hover:bg-surfaceBorder text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveToGallery}
                  disabled={isSaving}
                  className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save to Gallery
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Render the Lumina Modal if they hit the paywall */}
      <AnimatePresence>
        {isUpgradeOpen && <LuminaModal onClose={() => setIsUpgradeOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}