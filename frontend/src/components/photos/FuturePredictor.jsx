import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserPhotos, createAlbum } from '../../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, Plus, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function FuturePredictor() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [prediction, setPrediction] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        async function predictFuture() {
            try {
                const photos = await getUserPhotos(currentUser.uid);
                if (photos.length === 0) return;

                // 1. Establish the "Future" Window (Next Month)
                const today = new Date();
                const currentMonth = today.getMonth();
                const nextMonth = (currentMonth + 1) % 12;
                const currentYear = today.getFullYear();

                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const upcomingMonthName = monthNames[nextMonth];

                // 2. Find photos from this exact month in PREVIOUS years
                const historicalPhotos = photos.filter(p => {
                    if (!p.createdAt) return false;
                    const d = p.createdAt.toDate();
                    return d.getMonth() === nextMonth && d.getFullYear() < currentYear;
                });

                if (historicalPhotos.length === 0) return;

                // 3. Find the dominant theme/tag for this upcoming time of year
                const tagCounts = {};
                const ignoredTags = ['screenshot', 'text', 'document', 'image', 'photo', 'picture'];

                historicalPhotos.forEach(p => {
                    if (!p.tags) return;
                    p.tags.forEach(tag => {
                        const t = tag.toLowerCase();
                        if (!ignoredTags.includes(t)) {
                            tagCounts[t] = (tagCounts[t] || 0) + 1;
                        }
                    });
                });

                // 4. If we find a strong recurring pattern, generate a prediction!
                const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

                if (topTags.length > 0 && topTags[0][1] >= 2) {
                    const predictedTheme = topTags[0][0]; // e.g., "hackathon", "goa", "birthday"

                    setPrediction({
                        theme: predictedTheme,
                        monthName: upcomingMonthName,
                        year: currentYear,
                        suggestedAlbumName: `${predictedTheme.charAt(0).toUpperCase() + predictedTheme.slice(1)} ${currentYear}`,
                        message: `You usually take a lot of photos of "${predictedTheme}" in ${upcomingMonthName}. Ready to create new memories?`
                    });
                }

            } catch (error) {
                console.error("Failed to predict future:", error);
            }
        }

        predictFuture();
    }, [currentUser]);

    const handleCreatePredictedAlbum = async () => {
        setIsCreating(true);
        try {
            const newAlbum = await createAlbum(
                currentUser.uid,
                prediction.suggestedAlbumName,
                true,
                prediction.theme
            );
            navigate('/albums', {
                state: {
                    openCreateModal: true,
                    suggestedName: prediction.suggestedAlbumName,
                    suggestedKeyword: prediction.theme,
                    isLiving: true
                }
            });
        } catch (error) {
            console.error("Failed to create predicted album:", error);
            setIsCreating(false);
        }
    };

    if (!prediction) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 32 }}
                className="overflow-hidden"
            >
                <div className="relative glass-panel rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-blue-900/10 p-1">

                    {/* Animated Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />

                    <div className="relative bg-surface/80 backdrop-blur-xl rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                        <div className="flex items-start gap-4 w-full md:w-auto">
                            <div className="bg-indigo-500/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/30 shadow-inner">
                                <Telescope size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Future Prediction</h3>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    Upcoming: {prediction.suggestedAlbumName}
                                </h2>
                                <p className="text-gray-400 text-sm max-w-md">
                                    {prediction.message} Let's set up a smart album to catch them automatically.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleCreatePredictedAlbum}
                            disabled={isCreating}
                            className="w-full md:w-auto whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            <span>Prepare Album</span>
                            {!isCreating && <ArrowRight size={16} />}
                        </button>

                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}