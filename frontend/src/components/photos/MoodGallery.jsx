import React from 'react';
import { motion } from 'framer-motion';

const moods = [
  { id: 'Joyful', label: 'Happy', emoji: '😊', color: 'bg-yellow-400' },
  { id: 'Serene', label: 'Calm', emoji: '🌊', color: 'bg-blue-400' },
  { id: 'Energetic', label: 'Party', emoji: '🎉', color: 'bg-pink-500' },
  { id: 'Romantic', label: 'Romantic', emoji: '❤️', color: 'bg-red-500' },
  { id: 'Melancholic', label: 'Moody', emoji: '☁️', color: 'bg-indigo-400' }
];

export default function MoodGallery({ activeMood, onMoodSelect }) {
  return (
    <div className="flex flex-wrap gap-3 mb-8 justify-center mt-10">
      <button
        onClick={() => onMoodSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
          !activeMood 
            ? 'bg-white text-black border-white' 
            : 'bg-surface/50 text-gray-400 border-surfaceBorder hover:text-white'
        }`}
      >
        All Memories
      </button>

      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onMoodSelect(mood.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
            activeMood === mood.id 
              ? `${mood.color} text-white border-transparent shadow-lg` 
              : 'bg-surface/50 text-gray-400 border-surfaceBorder hover:border-gray-500'
          }`}
        >
          <span>{mood.emoji}</span>
          {mood.label}
        </motion.button>
      ))}
    </div>
  );
}