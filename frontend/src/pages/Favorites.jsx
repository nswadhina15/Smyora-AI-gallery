import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFavoritePhotos } from '../services/db'; // The new fetch function
import Sidebar from '../components/layout/Sidebar';
import PhotoGrid from '../components/photos/PhotoGrid';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function Favorites() {
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          <header className="flex justify-between items-center glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/20 p-3 rounded-xl border border-pink-500/30">
                <Heart className="text-pink-500" size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Favorite Memories</h1>
                <p className="text-gray-400 text-sm mt-1">Your handpicked premium collection.</p>
              </div>
            </div>
          </header>

          <section>
            {/* We reuse the PhotoGrid! We just need to make sure it fetches favorites. 
                Wait! Our PhotoGrid currently fetches ALL photos inside its own useEffect. 
                Let's tell it to fetch ONLY favorites if we are on this page! */}
            <FavoritesGrid userId={currentUser?.uid} />
          </section>
        </motion.div>
      </main>
    </div>
  );
}

// A customized wrapper for the grid specifically for the favorites page
function FavoritesGrid({ userId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function loadFavorites() {
      setLoading(true);
      try {
        const data = await getFavoritePhotos(userId);
        setPhotos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
  }, [userId]);

  // We are creating a lightweight grid here to avoid modifying our main PhotoGrid too much
  return (
    <div className="mt-8 columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {loading ? (
        <div className="text-white text-center w-full mt-10">Loading favorites...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 text-gray-500 glass-panel mt-8 inline-block w-full">
          No favorites yet. Heart some photos on your Dashboard!
        </div>
      ) : (
        photos.map((photo) => (
          <div key={photo.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden glass-panel mb-4 inline-block w-full">
            <img src={photo.url} alt="Favorite" className="w-full h-auto" />
            <div className="absolute top-4 right-4 bg-pink-500/20 p-2 rounded-full border border-pink-500 backdrop-blur-md">
              <Heart size={16} className="text-pink-500" fill="currentColor" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}