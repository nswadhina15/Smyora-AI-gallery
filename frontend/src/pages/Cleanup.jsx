import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPhotos, deletePhotoRecord } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trash2, Copy, Smartphone, ScanFace, CheckCircle2, Loader2 } from 'lucide-react';

export default function Cleanup() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);

    // Cleanup Categories
    const [screenshots, setScreenshots] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        // Just verifying auth on mount
        if (currentUser) setLoading(false);
    }, [currentUser]);

    const runSmartScan = async () => {
        setIsScanning(true);

        try {
            const allPhotos = await getUserPhotos(currentUser.uid);

            // 1. Detect Screenshots (Unchanged)
            const foundScreenshots = allPhotos.filter(photo =>
                photo.format === 'png' ||
                (photo.tags && photo.tags.some(t => ['screenshot', 'text', 'document'].includes(t.toLowerCase())))
            );

            const foundDuplicates = [];

            // --- THE NEW STRICT DUPLICATE ENGINE ---

            // PASS 1: Exact Duplicates (File Signature Match)
            // If a photo has the exact same bytes, width, and height, it is 99.9% an identical file.
            const seenSignatures = new Map();

            allPhotos.forEach(photo => {
                if (photo.bytes) {
                    const signature = `${photo.bytes}-${photo.width}-${photo.height}`;

                    if (seenSignatures.has(signature)) {
                        // Found a perfect match! Flag both the original and the clone
                        const original = seenSignatures.get(signature);
                        if (!foundDuplicates.find(p => p.id === original.id)) foundDuplicates.push(original);
                        if (!foundDuplicates.find(p => p.id === photo.id)) foundDuplicates.push(photo);
                    } else {
                        seenSignatures.set(signature, photo);
                    }
                }
            });

            // PASS 2: Strict Burst Photos
            // Only flag photos as duplicates if taken within 2 seconds OF THE SAME SCENE (matching dimensions)
            const sortedByTime = [...allPhotos].sort((a, b) =>
                (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)
            );

            for (let i = 0; i < sortedByTime.length - 1; i++) {
                const current = sortedByTime[i];
                const next = sortedByTime[i + 1];

                const timeDiff = Math.abs((next.createdAt?.toMillis() || 0) - (current.createdAt?.toMillis() || 0));

                // STRICTER: Max 2000ms apart AND must have the exact same camera orientation/resolution
                if (timeDiff > 0 && timeDiff <= 2000) {
                    if (current.width === next.width && current.height === next.height) {
                        if (!foundDuplicates.find(p => p.id === current.id)) foundDuplicates.push(current);
                        if (!foundDuplicates.find(p => p.id === next.id)) foundDuplicates.push(next);
                    }
                }
            }

            // Simulate processing time for UX
            setTimeout(() => {
                setScreenshots(foundScreenshots);
                setDuplicates(foundDuplicates);
                setIsScanning(false);
                setHasScanned(true);
            }, 2500);

        } catch (error) {
            console.error("Scan failed:", error);
            setIsScanning(false);
        }
    };

    const trashPhoto = async (photo) => {
        setDeletingId(photo.id);
        try {
            // Delete from Cloudinary
            const cloudRes = await fetch('https://smyora-backend.onrender.com/api/upload/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: photo.publicId })
            });

            if (!cloudRes.ok) throw new Error("Failed to delete from cloud");

            // Delete from Firebase
            await deletePhotoRecord(photo.id);

            // Remove from UI instantly
            setScreenshots(prev => prev.filter(p => p.id !== photo.id));
            setDuplicates(prev => prev.filter(p => p.id !== photo.id));

        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Could not delete photo.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    const totalClutter = screenshots.length + duplicates.length;

    return (
        <div className="min-h-screen flex bg-background">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative overflow-hidden">

                {/* Header Section */}
                <div className="max-w-5xl mx-auto mb-10 text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-full mb-4 border border-primary/30 shadow-lg shadow-primary/20">
                        <Sparkles className="text-primary" size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Smart Cleanup</h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Let AI scan your gallery to find screenshots, burst photos, and clutter taking up your storage space.
                    </p>

                    {!hasScanned && !isScanning && (
                        <button
                            onClick={runSmartScan}
                            className="mt-8 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-white/10 flex items-center gap-2 mx-auto"
                        >
                            <ScanFace size={20} />
                            Start Gallery Scan
                        </button>
                    )}
                </div>

                {/* Scanning Animation */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="max-w-md mx-auto glass-panel p-8 rounded-3xl text-center border border-primary/30 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                            <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                            <h3 className="text-xl font-bold text-white mb-2">Analyzing Pixels...</h3>
                            <p className="text-sm text-gray-400">Looking for duplicates and screenshots.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Section */}
                <AnimatePresence>
                    {hasScanned && !isScanning && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="max-w-5xl mx-auto space-y-12"
                        >
                            {totalClutter === 0 ? (
                                <div className="text-center py-20 glass-panel rounded-3xl border border-green-500/30">
                                    <CheckCircle2 className="text-green-500 mx-auto mb-4" size={48} />
                                    <h2 className="text-2xl font-bold text-white">Your gallery is sparkling clean!</h2>
                                    <p className="text-gray-400 mt-2">We couldn't find any obvious clutter.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Duplicates Row */}
                                    {duplicates.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30"><Copy className="text-orange-400" size={20} /></div>
                                                <h2 className="text-2xl font-bold text-white">Similar Photos</h2>
                                                <span className="bg-surfaceBorder text-gray-300 px-3 py-1 rounded-full text-xs font-bold">{duplicates.length} found</span>
                                            </div>

                                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                                                <AnimatePresence>
                                                    {duplicates.map(photo => (
                                                        <CleanupCard key={`dup-${photo.id}`} photo={photo} onDelete={() => trashPhoto(photo)} isDeleting={deletingId === photo.id} />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </section>
                                    )}

                                    {/* Screenshots Row */}
                                    {screenshots.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30"><Smartphone className="text-blue-400" size={20} /></div>
                                                <h2 className="text-2xl font-bold text-white">Screenshots</h2>
                                                <span className="bg-surfaceBorder text-gray-300 px-3 py-1 rounded-full text-xs font-bold">{screenshots.length} found</span>
                                            </div>

                                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                                                <AnimatePresence>
                                                    {screenshots.map(photo => (
                                                        <CleanupCard key={`scr-${photo.id}`} photo={photo} onDelete={() => trashPhoto(photo)} isDeleting={deletingId === photo.id} />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Sub-component for the individual photos in the cleanup view
function CleanupCard({ photo, onDelete, isDeleting }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="min-w-[160px] max-w-[160px] aspect-[3/4] rounded-2xl overflow-hidden relative group snap-start border border-surfaceBorder bg-surface"
        >
            <img src={photo.url} alt="Review" className="w-full h-full object-cover" />

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
                onClick={onDelete}
                disabled={isDeleting}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform translate-y-10 group-hover:translate-y-0 transition-all disabled:opacity-50"
            >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            </button>
        </motion.div>
    );
}