import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPhotos } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Loader2, UserCircle } from 'lucide-react';
import Lightbox from '../components/photos/Lightbox';

export default function People() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [peopleGroups, setPeopleGroups] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    async function groupFaces() {
      try {
        const photos = await getUserPhotos(currentUser.uid);
        
        // --- SIMULATED FACE CLUSTERING ENGINE ---
        // In a production app, your backend would return a "faces" array with UUIDs.
        // Here, we will intelligently extract tags that represent "People" to build the UI instantly.
        
        const groups = {};
        
        // Words to ignore so we only get "Names" or "Identities"
        const ignoredTags = ['beach', 'sunset', 'dog', 'cat', 'water', 'sky', 'nature', 'city', 'building', 'car', 'screenshot', 'document'];

        photos.forEach(photo => {
          if (!photo.tags) return;
          
          photo.tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            if (ignoredTags.includes(normalizedTag)) return;
            
            // If it's a person/name tag, group it!
            if (!groups[normalizedTag]) {
              groups[normalizedTag] = {
                id: normalizedTag,
                name: tag.charAt(0).toUpperCase() + tag.slice(1),
                coverPhoto: photo.url, // Use the first photo as their avatar
                photos: []
              };
            }
            // Avoid adding the exact same photo twice to a person's album
            if (!groups[normalizedTag].photos.find(p => p.id === photo.id)) {
                groups[normalizedTag].photos.push(photo);
            }
          });
        });

        // Convert the object to an array and only show groups that have at least 1 photo
        const validPeople = Object.values(groups)
            .filter(person => person.photos.length > 0)
            .sort((a, b) => b.photos.length - a.photos.length); // Sort by most photos

        setPeopleGroups(validPeople);
      } catch (error) {
        console.error("Failed to group people:", error);
      } finally {
        setLoading(false);
      }
    }

    groupFaces();
  }, [currentUser]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {!selectedPerson ? (
            // --- MAIN PEOPLE DIRECTORY ---
            <motion.div 
              key="directory"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto"
            >
              <header className="mb-10 flex items-center gap-4">
                <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/30">
                  <Users className="text-blue-400" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">People</h1>
                  <p className="text-gray-400">Faces detected across your entire gallery.</p>
                </div>
              </header>

              {peopleGroups.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-3xl border border-dashed border-surfaceBorder">
                  <UserCircle className="text-gray-500 mx-auto mb-4" size={48} />
                  <h2 className="text-xl text-white font-medium">No faces detected yet</h2>
                  <p className="text-gray-400 text-sm mt-2">Upload more photos with people in them!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                  {peopleGroups.map((person) => (
                    <motion.div
                      key={person.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPerson(person)}
                      className="flex flex-col items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-surfaceBorder group-hover:border-blue-400 transition-colors shadow-lg relative">
                        <img 
                          src={person.coverPhoto} 
                          alt={person.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        {/* A dark gradient at the bottom for aesthetic */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-medium text-sm sm:text-base group-hover:text-blue-400 transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-xs text-gray-500">{person.photos.length} photos</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            
            // --- INDIVIDUAL PERSON VIEW ---
            <motion.div 
              key="person-view"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="max-w-7xl mx-auto"
            >
              <button 
                onClick={() => setSelectedPerson(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-8 bg-surface/50 px-4 py-2 rounded-full border border-surfaceBorder w-fit"
              >
                <ArrowLeft size={16} /> Back to People
              </button>

              <header className="flex flex-col md:flex-row items-center gap-6 mb-10 glass-panel p-8 rounded-3xl border border-blue-500/20">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl">
                  <img src={selectedPerson.coverPhoto} alt={selectedPerson.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-bold text-white mb-2">{selectedPerson.name}</h1>
                  <p className="text-blue-400/80 font-medium">{selectedPerson.photos.length} memories together</p>
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedPerson.photos.map(photo => (
                  <div 
                    key={photo.id} 
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square rounded-xl overflow-hidden cursor-zoom-in relative group border border-surfaceBorder/50 shadow-lg"
                  >
                    <img 
                      src={photo.url} 
                      alt="Memory" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox for viewing photos from the People grid */}
        <AnimatePresence>
          {selectedPhoto && (
            <Lightbox
              photo={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}