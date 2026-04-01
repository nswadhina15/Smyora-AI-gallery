import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Download, Trash2, Loader2, Heart, FolderPlus, Wand2, Sparkles, Dna, Fingerprint, Maximize, Check, Lock, Plus, Zap, FolderMinus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserAlbums, updatePhotoDNA, toggleVaultStatus, addTagToPhoto } from '../../services/db';
import AltRealityStudio from './AltRealityStudio';

export default function Lightbox({ photo, onClose, onDelete, isDeleting, onToggleFavorite, onMoveToAlbum, onRemoveFromAlbum }) {
  const { currentUser } = useAuth();

  // NEW: State for the album dropdown menu
  const [showMenu, setShowMenu] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [magicAction, setMagicAction] = useState('remove');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modifiedUrl, setModifiedUrl] = useState(null);
  const [isScanningDNA, setIsScanningDNA] = useState(false);
  const [dnaProfile, setDnaProfile] = useState(photo?.dna || null);
  const [localTags, setLocalTags] = useState(photo?.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAltRealityOpen, setIsAltRealityOpen] = useState(false);


  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    setLocalTags(photo?.tags || []);
  }, [photo]);

  if (!photo) return null;

  const dateStr = photo.createdAt?.toDate
    ? photo.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently Uploaded';

  const handleDownload = (e) => {
    e.stopPropagation();
    const urlToDownload = modifiedUrl || photo.url;
    const downloadUrl = urlToDownload.replace('/upload/', '/upload/fl_attachment/');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `magic-image-${photo.publicId}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleMenu = async (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    if (!showMenu && albums.length === 0) {
      setLoadingAlbums(true);
      try {
        const data = await getUserAlbums(currentUser.uid);
        setAlbums(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAlbums(false);
      }
    }
  };

  const applyMagic = (e) => {
    e.preventDefault();
    if (!magicPrompt.trim()) return;

    setIsGenerating(true);

    // Format the prompt for URL (replace spaces with %20)
    const formattedPrompt = encodeURIComponent(magicPrompt.trim());

    let transformation = '';
    if (magicAction === 'remove') {
      // Cloudinary Gen Remove Syntax
      transformation = `e_gen_remove:prompt_${formattedPrompt}/`;
    } else if (magicAction === 'replace_bg') {
      // Cloudinary Gen Background Replace Syntax
      transformation = `e_gen_background_replace:prompt_${formattedPrompt}/`;
    }
    const newUrl = photo.url.replace('/upload/', `/upload/${transformation}`);

    setModifiedUrl(newUrl);

    setTimeout(() => {
      setIsGenerating(false);
    }, 2500);
  };

  const handleScanDNA = async (e) => {
    e.stopPropagation();
    if (dnaProfile) return; // Already scanned

    setIsScanningDNA(true);
    try {
      const res = await fetch('http://localhost:5000/api/vision/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photo.url })
      });

      if (!res.ok) throw new Error("Failed to scan");
      const data = await res.json();

      setDnaProfile(data);
      // Save to database so we never have to scan this photo again
      await updatePhotoDNA(photo.id, data);

      // Optional: Update the local photo object so it doesn't clear on toggle
      photo.dna = data;
    } catch (error) {
      console.error("DNA Scan failed:", error);
      alert("Failed to extract DNA. AI might be busy.");
    } finally {
      setIsScanningDNA(false);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) {
      setIsAddingTag(false);
      return;
    }

    const tagToSave = newTag.trim().toLowerCase();

    // Prevent duplicates locally
    if (!localTags.includes(tagToSave)) {
      // Optimistic UI update (feels instant to the user)
      const updatedTags = [...localTags, tagToSave];
      setLocalTags(updatedTags);
      photo.tags = updatedTags; // Update the parent object reference

      try {
        await addTagToPhoto(photo.id, tagToSave);
      } catch (error) {
        console.error(error);
        alert("Failed to save tag.");
      }
    }

    setNewTag('');
    setIsAddingTag(false);
  };

  const currentDisplayUrl = modifiedUrl || photo.url;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">

        <div className="text-white flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-medium text-lg text-white/90">
              {modifiedUrl ? "✨ AI Generated Result" : "Image Details"}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={12} /> {dateStr}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleScanDNA}
            disabled={isScanningDNA || dnaProfile}
            className={`p-2 border rounded-full transition-all backdrop-blur-md shadow-lg ${dnaProfile
              ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/30'
              : 'bg-surface/50 border-surfaceBorder text-blue-400 hover:bg-blue-500/20'
              }`}
            title="Extract Photo DNA"
          >
            {isScanningDNA ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMagicMode(!isMagicMode); setShowMenu(false); }}
            className={`p-2 border rounded-full transition-all backdrop-blur-md shadow-lg shadow-purple-500/20 ${isMagicMode ? 'bg-purple-500 text-white border-purple-500' : 'bg-surface/50 border-surfaceBorder text-purple-400 hover:bg-purple-500/20'
              }`}
            title="AI Magic Room"
          >
            <Wand2 size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsAltRealityOpen(true); setShowMenu(false); }}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-pink-400 rounded-full transition-all shadow-lg shadow-pink-500/30 hover:scale-105"
            title="Enter Alt Reality"
          >
            <Zap size={18} fill="currentColor" />
          </button>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); if (onToggleFavorite) onToggleFavorite(photo); }}
            className={`p-2 border rounded-full transition-all backdrop-blur-md ${photo.isFavorite ? 'bg-pink-500/20 border-pink-500 text-pink-500 hover:bg-pink-500/40' : 'bg-surface/50 border-surfaceBorder text-white hover:bg-surface hover:text-pink-400'
              }`}
            title={photo.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={18} fill={photo.isFavorite ? "currentColor" : "none"} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={async (e) => {
              e.stopPropagation();
              await toggleVaultStatus(photo.id, photo.inVault);
              photo.inVault = !photo.inVault;
            }}
            className={`p-2 border rounded-full transition-all backdrop-blur-md ${photo.inVault
                ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/40'
                : 'bg-surface/50 border-surfaceBorder text-white hover:bg-surface hover:text-red-400'
              }`}
            title={photo.inVault ? "Remove from Vault" : "Move to Vault"}
          >
            <Lock size={18} fill={photo.inVault ? "currentColor" : "none"} />
          </motion.button>

          <div className="relative">
            <button
              onClick={handleToggleMenu}
              className={`p-2 border rounded-full transition-all backdrop-blur-md hidden sm:block ${showMenu ? 'bg-primary text-white border-primary' : 'bg-surface/50 border-surfaceBorder text-white hover:bg-surface'
                }`}
              title="Add to Album"
            >
              <FolderPlus size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-12 w-56 glass-panel rounded-xl overflow-hidden shadow-2xl z-50 border border-surfaceBorder"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-surfaceBorder/50 bg-surface/30">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Move to Album</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {loadingAlbums ? (
                      <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-primary" /></div>
                    ) : albums.length === 0 ? (
                      <div className="p-4 text-xs text-gray-400 text-center">No albums found.</div>
                    ) : (
                      albums.map(album => (
                        <button
                          key={album.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToAlbum(photo, album.id);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-primary/20 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{album.name}</span>
                          {photo.albumId === album.id && <Check size={14} className="text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Only show this button if they are viewing the photo INSIDE an album */}
          {onRemoveFromAlbum && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveFromAlbum(photo); }} 
              className="p-2 bg-surface/50 hover:bg-orange-500 hover:border-orange-500 border border-surfaceBorder rounded-full text-white transition-all backdrop-blur-md" 
              title="Remove from Album"
            >
              <FolderMinus size={18} />
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={isDeleting} className="p-2 bg-surface/50 hover:bg-red-500 hover:border-red-500 border border-surfaceBorder rounded-full text-white transition-all backdrop-blur-md disabled:opacity-50">
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>

          <button onClick={handleDownload} className="p-2 bg-surface/50 hover:bg-surface border border-surfaceBorder rounded-full text-white transition-all backdrop-blur-md hidden sm:block">
            <Download size={18} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-surface/50 hover:bg-white/20 border border-surfaceBorder rounded-full text-white transition-all backdrop-blur-md">
            <X size={20} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} // Close menu if clicking the image
      >
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center text-purple-400 space-y-4">
            <Loader2 size={64} className="animate-spin" />
            <h2 className="text-2xl font-bold text-white">Synthesizing Pixels...</h2>
            <p className="text-purple-300">Cloudinary AI is altering reality.</p>
          </div>
        ) : (
          <img
            key={currentDisplayUrl}
            src={currentDisplayUrl}
            alt="Fullscreen view"
            className="w-full h-full object-contain rounded-lg shadow-2xl shadow-black/80"
          />
        )}

        {/* NEW: Photo DNA HUD (Heads Up Display) */}
        <AnimatePresence>
          {dnaProfile && !isMagicMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 sm:bottom-14 left-1/2 -translate-x-1/2 glass-panel border border-blue-500/30 p-4 rounded-2xl shadow-2xl shadow-blue-500/20 w-[90%] sm:w-auto flex flex-col sm:flex-row items-center gap-6 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Dna className="text-blue-400" size={20} />
                <span className="text-white font-bold tracking-widest text-sm uppercase">Photo DNA</span>
              </div>

              <div className="h-8 w-px bg-surfaceBorder hidden sm:block"></div>

              {/* Color Palette */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Palette</span>
                {dnaProfile.colors?.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <div className="h-8 w-px bg-surfaceBorder hidden sm:block"></div>

              {/* Mood & Energy */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Mood</span>
                  <span className="text-white font-medium capitalize">{dnaProfile.mood}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Energy</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surfaceBorder rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${dnaProfile.energy}%` }}></div>
                    </div>
                    <span className="text-white font-medium text-sm">{dnaProfile.energy}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Interactive Tags Overlay */}
        <div className="absolute top-14 left-4 flex flex-wrap items-center gap-2 max-w-md z-20">
          {localTags.slice(0, 8).map((tag, index) => (
            <span key={index} className="px-3 py-1 text-xs font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20 rounded-full capitalize shadow-lg">
              #{tag}
            </span>
          ))}

          {isAddingTag ? (
            <form onSubmit={handleAddTag} onClick={(e) => e.stopPropagation()} className="flex items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="add tag..."
                autoFocus
                onBlur={handleAddTag} // Saves automatically if they click away
                className="px-3 py-1 text-xs font-semibold text-white bg-black/60 backdrop-blur-xl border border-primary/50 rounded-full outline-none focus:border-primary w-28 shadow-lg shadow-primary/20 transition-all"
              />
            </form>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setIsAddingTag(true); }}
              className="px-3 py-1 text-xs font-bold text-gray-300 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-dashed border-white/30 hover:border-white/60 hover:text-white rounded-full transition-all flex items-center gap-1 shadow-lg"
            >
              <Plus size={12} strokeWidth={3} /> Add Tag
            </button>
          )}
        </div>

        <AnimatePresence>
          {isMagicMode && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-panel border border-purple-500/30 p-4 rounded-2xl shadow-2xl shadow-purple-500/20 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={applyMagic} className="flex flex-col sm:flex-row gap-4">
                <select
                  value={magicAction}
                  onChange={(e) => setMagicAction(e.target.value)}
                  className="bg-surface/50 border border-surfaceBorder text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                >
                  <option value="remove">Remove Object</option>
                  <option value="replace_bg">Replace Background</option>
                </select>

                <input
                  type="text"
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  placeholder={magicAction === 'remove' ? "e.g., 'dog', 'person', 'car'" : "e.g., 'cyberpunk city', 'mars surface'"}
                  className="flex-1 bg-surface/30 border border-surfaceBorder rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
                  required
                />

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-purple-600/30"
                >
                  <Sparkles size={18} /> Generate
                </button>

                {modifiedUrl && (
                  <button
                    type="button"
                    onClick={() => { setModifiedUrl(null); setMagicPrompt(''); }}
                    className="bg-surface hover:bg-surfaceBorder text-white px-4 py-3 rounded-xl transition-all"
                  >
                    Reset
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
  {isAltRealityOpen && (
    <AltRealityStudio 
      photo={photo} 
      onClose={() => setIsAltRealityOpen(false)} 
    />
  )}
</AnimatePresence>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-full flex items-center gap-4 text-xs text-gray-300 pointer-events-none">
          <span className="flex items-center gap-1"><Maximize size={14} className="text-primary" /> {photo.width} x {photo.height}</span>
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          <span>{(photo.bytes / 1024 / 1024).toFixed(2)} MB</span>
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          <span className="uppercase text-primary">{photo.format}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}