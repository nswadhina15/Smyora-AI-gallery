import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPhotos } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet's default marker icon bug in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

export default function LifeMap() {
    const { currentUser } = useAuth();
    const [mapPhotos, setMapPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        async function loadMapData() {
            try {
                const photos = await getUserPhotos(currentUser.uid);

                // REAL DATA: Filter out any photos that don't have GPS data attached
                const photosWithLocation = photos.filter(photo => photo.location && photo.location.lat && photo.location.lng);

                setMapPhotos(photosWithLocation);
            } catch (error) {
                console.error("Failed to load map photos", error);
            } finally {
                setLoading(false);
            }
        }
        loadMapData();
    }, [currentUser]);

    return (
        <div className="min-h-screen flex bg-background">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative flex flex-col h-screen">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col space-y-6 h-full relative z-0">

                    <header className="flex justify-between items-center glass-panel p-6 rounded-2xl shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                                <MapPin className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Life Map</h1>
                                <p className="text-gray-400 text-sm mt-1">Explore your memories geographically.</p>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 glass-panel rounded-2xl overflow-hidden border border-surfaceBorder relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={40} /></div>
                        ) : (
                            <MapContainer
                                center={[20.5937, 78.9629]} // Center of India
                                zoom={5}
                                className="h-full w-full z-0"
                            >
                                {/* Beautiful dark mode map tiles */}
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />

                                {mapPhotos.map((photo) => (
                                    <Marker
                                        key={photo.id}
                                        position={[photo.location.lat, photo.location.lng]}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-1 w-48 flex flex-col items-center">
                                                <img
                                                    src={photo.url}
                                                    alt="Memory"
                                                    className="w-full h-32 object-cover rounded-lg shadow-md mb-2"
                                                />
                                                <span className="font-semibold text-gray-800 text-sm w-full truncate text-center">
                                                    {photo.location.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {photo.createdAt?.toDate().toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                    </div>

                </motion.div>
            </main>

            {/* CSS overrides for the Leaflet popup to make it look modern */}
            <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 4px;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        .leaflet-container {
          background: #0f172a; /* matches our dark theme */
        }
      `}</style>
        </div>
    );
}