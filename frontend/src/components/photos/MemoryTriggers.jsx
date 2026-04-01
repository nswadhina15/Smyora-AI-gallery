import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserPhotos } from '../../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarHeart, Palette, Plane } from 'lucide-react';

export default function MemoryTriggers() {
    const { currentUser } = useAuth();
    const [triggers, setTriggers] = useState([]);

    useEffect(() => {
        if (!currentUser) return;

        async function analyzePatterns() {
            try {
                const photos = await getUserPhotos(currentUser.uid);
                if (photos.length === 0) return;

                // 1. Get current time context
                const today = new Date();
                const currentMonth = today.getMonth(); // 0-11
                const nextMonth = (currentMonth + 1) % 12;

                // 2. Filter for photos taken around this time of year, but in PAST years
                const upcomingPhotos = photos.filter(p => {
                    if (!p.createdAt) return false;
                    const d = p.createdAt.toDate();
                    return (d.getMonth() === currentMonth || d.getMonth() === nextMonth) &&
                        d.getFullYear() < today.getFullYear();
                });

                // 3. Analyze AI Tags to find recurring traditions
                const tagCountsByYear = {}; // Format: { "beach": { 2024: 5, 2025: 12 } }

                upcomingPhotos.forEach(p => {
                    if (!p.tags) return;
                    const year = p.createdAt.toDate().getFullYear();

                    p.tags.forEach(tag => {
                        const t = tag.toLowerCase();
                        // Filter out boring tags
                        if (['screenshot', 'text', 'document', 'image'].includes(t)) return;

                        if (!tagCountsByYear[t]) tagCountsByYear[t] = {};
                        if (!tagCountsByYear[t][year]) tagCountsByYear[t][year] = 0;
                        tagCountsByYear[t][year]++;
                    });
                });

                // 4. A "Tradition" is a tag that appears in MULTIPLE past years during this season
                const patterns = [];
                Object.entries(tagCountsByYear).forEach(([tag, yearData]) => {
                    const yearsActive = Object.keys(yearData).length;
                    if (yearsActive >= 2) {
                        patterns.push({
                            tag,
                            years: yearsActive,
                            totalPhotos: Object.values(yearData).reduce((a, b) => a + b, 0)
                        });
                    }
                });

                // Sort by the most recurring traditions
                patterns.sort((a, b) => b.years - a.years || b.totalPhotos - a.totalPhotos);

                // 5. Generate the UI Cards
                const generatedTriggers = patterns.slice(0, 2).map(p => {
                    const capitalizedTag = p.tag.charAt(0).toUpperCase() + p.tag.slice(1);

                    // Dynamic Icons/Colors based on keywords
                    let icon = <CalendarHeart className="text-pink-400" size={24} />;
                    let color = "from-pink-500/20 to-rose-500/10";
                    let border = "border-pink-500/30";

                    if (['beach', 'goa', 'travel', 'mountain', 'vacation'].includes(p.tag)) {
                        icon = <Plane className="text-blue-400" size={24} />;
                        color = "from-blue-500/20 to-cyan-500/10";
                        border = "border-blue-500/30";
                    } else if (['holi', 'diwali', 'festival', 'color', 'party'].includes(p.tag)) {
                        icon = <Palette className="text-purple-400" size={24} />;
                        color = "from-purple-500/20 to-fuchsia-500/10";
                        border = "border-purple-500/30";
                    }

                    return {
                        id: p.tag,
                        title: `Your yearly ${capitalizedTag} tradition!`,
                        subtitle: `You've taken ${p.totalPhotos} photos of ${p.tag}s around this time of year. Ready for the next one?`,
                        icon, color, border
                    }
                });

                setTriggers(generatedTriggers);
            } catch (error) {
                console.error("Failed to analyze memory patterns:", error);
            }
        }

        analyzePatterns();
    }, [currentUser]);

    if (triggers.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 mt-8">
            <AnimatePresence>
                {triggers.map((trigger, i) => (
                    <motion.div
                        key={trigger.id}
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={`glass-panel p-6 rounded-2xl border ${trigger.border} bg-gradient-to-br ${trigger.color} relative overflow-hidden group shadow-lg`}
                    >
                        <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:opacity-30 transition-opacity duration-500 rotate-12 group-hover:rotate-0 group-hover:scale-110">
                            <Sparkles size={100} />
                        </div>

                        <div className="flex items-start gap-4 relative z-10">
                            <div className="bg-background/50 p-3 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                                {trigger.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{trigger.title}</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">{trigger.subtitle}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}