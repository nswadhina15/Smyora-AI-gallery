import React, { useState, useEffect } from 'react';
import { 
  getUserPhotos, 
  deletePhotoRecord, 
  toggleFavoriteStatus, 
  getAlbumPhotos, 
  updatePhotoAlbum, 
  setAlbumCover,
  subscribeToAlbumPhotos,
  removePhotoFromAlbum
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Star } from 'lucide-react';
import Lightbox from './Lightbox';

export default function PhotoGrid({ refreshTrigger, onRefresh, searchQuery = '', moodFilter = null, albumId = null }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe;

    async function loadPhotos() {
      setLoading(true);
      try {
        if (albumId) {
          unsubscribe = await subscribeToAlbumPhotos(currentUser.uid, albumId, (updatedPhotos) => {
            setPhotos(updatedPhotos);
            setLoading(false);
          });
        } else {
          // Standard Dashboard mode
          const data = await getUserPhotos(currentUser.uid);
          setPhotos(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load photos", error);
        setLoading(false);
      }
    }

    loadPhotos();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, refreshTrigger, albumId]);

  const handleDelete = async (photo) => {
    if (!window.confirm("Are you sure you want to permanently delete this photo?")) return;
    setIsDeleting(true);
    try {
      const cloudRes = await fetch('http://localhost:5000/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: photo.publicId })
      });
      if (!cloudRes.ok) throw new Error("Failed to delete from Cloudinary");

      await deletePhotoRecord(photo.id);

      setSelectedPhoto(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Deletion failed:", error);
      alert("Failed to delete photo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async (photo) => {
    try {
      const newStatus = !photo.isFavorite;
      setSelectedPhoto({ ...photo, isFavorite: newStatus });
      setPhotos(prevPhotos => prevPhotos.map(p =>
        p.id === photo.id ? { ...p, isFavorite: newStatus } : p
      ));
      await toggleFavoriteStatus(photo.id, photo.isFavorite);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setSelectedPhoto(photo);
    }
  };

  const handleMoveToAlbum = async (photo, targetAlbumId) => {
    try {
      await updatePhotoAlbum(photo.id, targetAlbumId);
      await setAlbumCover(targetAlbumId, photo.url);
      if (albumId && albumId !== targetAlbumId) {
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        setSelectedPhoto(null);
      } else {
        const updatedPhoto = { ...photo, albumId: targetAlbumId };
        setSelectedPhoto(updatedPhoto);
        setPhotos(prev => prev.map(p => p.id === photo.id ? updatedPhoto : p));
      }
    } catch (error) {
      console.error("Failed to move photo:", error);
      alert("Failed to move photo to album.");
    }
  };

  const handleRemoveFromAlbum = async (photo) => {
    if (!albumId) return;
    try {
      await removePhotoFromAlbum(photo.id, albumId);
      // Remove it from the local UI instantly
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSelectedPhoto(null);
    } catch (error) {
      console.error("Failed to remove photo:", error);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    // 1. Mood Filter Logic - Changed to 'moodFilter' to match your props
    if (moodFilter && photo.dna?.mood !== moodFilter) {
      return false;
    }

    // 2. Search Query Logic
    if (searchQuery) {
      const queryWords = searchQuery.toLowerCase().split(' ').filter(word => word.length > 0);
      const matchesSearch = photo.tags && Array.isArray(photo.tags) && photo.tags.some(tag =>
        queryWords.some(queryWord => tag.toLowerCase().includes(queryWord))
      );

      if (!matchesSearch) return false;
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (photos.length === 0) return <div className="text-center py-20 text-gray-500 border-2 border-dashed border-surfaceBorder rounded-2xl mt-8">No photos yet.</div>;

  // UPDATED: Dynamic error message for empty filters
  if (filteredPhotos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 glass-panel mt-8">
        No matches found for {moodFilter ? `mood "${moodFilter}"` : ""} {searchQuery ? `search "${searchQuery}"` : ""}
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        <AnimatePresence>
          {filteredPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden glass-panel cursor-zoom-in mb-4 inline-block w-full"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.url} alt="Gallery item" className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                <span className="text-white text-sm font-medium translate-y-2 group-hover:translate-y-0 transition-all duration-300">View Details</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => handleDelete(selectedPhoto)}
            isDeleting={isDeleting}
            onToggleFavorite={handleToggleFavorite}
            onMoveToAlbum={handleMoveToAlbum}
          />
        )}
      </AnimatePresence>

      <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => handleDelete(selectedPhoto)}
            isDeleting={isDeleting}
            onToggleFavorite={handleToggleFavorite}
            onMoveToAlbum={handleMoveToAlbum}
            onRemoveFromAlbum={albumId ? handleRemoveFromAlbum : null} // NEW PROP
          />
    </>
  );
}