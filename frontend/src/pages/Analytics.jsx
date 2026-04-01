import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPhotos } from '../services/db';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, CalendarDays, Smile, Users, Loader2, Sparkles, MapPin, Camera } from 'lucide-react';

export default function Analytics() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    async function analyzeLifePatterns() {
      try {
        const photos = await getUserPhotos(currentUser.uid);
        
        if (photos.length === 0) {
          setLoading(false);
          return;
        }

        // --- THE ANALYTICS ENGINE ---
        
        // 1. Month Activity (When do you take the most photos?)
        const monthCounts = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // 2. Mood Distribution (What's your overall vibe?)
        const moodCounts = {};
        
        // 3. Subject/People Frequency (Who/What do you photograph most?)
        const tagCounts = {};
        const ignoredTags = ['screenshot', 'text', 'document', 'image', 'photo', 'picture'];

        photos.forEach(photo => {
          // Time Analysis
          if (photo.createdAt) {
            const date = photo.createdAt.toDate();
            const month = monthNames[date.getMonth()];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
          }

          // Mood Analysis
          if (photo.dna?.mood) {
            const mood = photo.dna.mood;
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          }

          // Subject Analysis
          if (photo.tags) {
            photo.tags.forEach(tag => {
              const t = tag.toLowerCase();
              if (!ignoredTags.includes(t)) {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
              }
            });
          }
        });

        // Find the "Peaks"
        const topMonth = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b, "N/A");
        const topMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, "Neutral");
        
        // Get Top 3 Tags
        const topSubjects = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(entry => entry[0]);

        setInsights({
          totalPhotos: photos.length,
          topMonth,
          topMonthCount: monthCounts[topMonth] || 0,
          topMood,
          moodData: moodCounts,
          topSubjects
        });

      } catch (error) {
        console.error("Failed to analyze patterns:", error);
      } finally {
        setLoading(false);
      }
    }

    analyzeLifePatterns();
  }, [currentUser]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 relative overflow-hidden">
        
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 flex items-center gap-4">
            <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
              <LineChart className="text-emerald-400" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Life Patterns</h1>
              <p className="text-gray-400">AI-driven insights from your memories.</p>
            </div>
          </header>

          {!insights ? (
            <div className="text-center py-20 glass-panel rounded-3xl border border-dashed border-surfaceBorder">
              <Camera className="text-gray-500 mx-auto mb-4" size={48} />
              <h2 className="text-xl text-white font-medium">Not enough data yet</h2>
              <p className="text-gray-400 text-sm mt-2">Upload more photos so the AI can find your patterns!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Insight 1: Seasonality */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-3xl border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity"><CalendarDays size={120} /></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><CalendarDays size={20} /></div>
                  <h3 className="text-white font-bold">Peak Season</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{insights.topMonth}</p>
                <p className="text-gray-400 text-sm">You take the most photos in {insights.topMonth} ({insights.topMonthCount} snaps). It seems to be your busiest month!</p>
              </motion.div>

              {/* Insight 2: Top Subjects */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group lg:col-span-2">
                 <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={120} /></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Users size={20} /></div>
                  <h3 className="text-white font-bold">Your Universe</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {insights.topSubjects.map((subject, idx) => (
                    <div key={idx} className="bg-surface border border-surfaceBorder px-6 py-4 rounded-2xl flex-1 min-w-[140px] text-center">
                      <span className="block text-2xl font-bold text-white capitalize mb-1">#{subject}</span>
                      <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">Top Subject {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Insight 3: Emotional Profile */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden group md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <div className="bg-purple-500/20 w-24 h-24 rounded-full flex items-center justify-center text-purple-400 mx-auto mb-4 border border-purple-500/30">
                    <Smile size={40} />
                  </div>
                  <h3 className="text-white font-bold text-xl capitalize">{insights.topMood}</h3>
                  <p className="text-gray-400 text-sm">Dominant Vibe</p>
                </div>
                
                <div className="flex-1 w-full space-y-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2"><Sparkles size={16} className="text-purple-400"/> Emotional Spectrum</h4>
                  {Object.entries(insights.moodData).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([mood, count], idx) => (
                    <div key={idx} className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 capitalize">{mood}</span>
                        <span className="text-gray-500">{Math.round((count / insights.totalPhotos) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-surfaceBorder rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(count / insights.totalPhotos) * 100}%` }} 
                          transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}