import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { getUserPhotos } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

export default function MemoryChat({ onPhotoClick }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initial greeting
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hey! I'm your memory assistant. Ask me to find 'happy moments from last year' or 'photos of Abhijit'." }
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      // 1. Fetch the user's gallery
      const allPhotos = await getUserPhotos(currentUser.uid);
      
      // 2. Strip it down to lightweight metadata so the AI can read it fast
      const galleryContext = allPhotos.map(p => ({
        id: p.id,
        tags: p.tags || [],
        mood: p.dna?.mood || 'unknown',
        energy: p.dna?.energy || 50,
        date: p.createdAt?.toDate().toISOString() || new Date().toISOString()
      }));

      // 3. Send query + metadata to your Node backend
      const res = await fetch('https://smyora-backend.onrender.com/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage, 
          gallery: galleryContext 
        })
      });

      if (!res.ok) throw new Error("AI failed to respond");
      const data = await res.json();

      // 4. The AI returns a conversational text AND a list of Photo IDs it found
      // We map those IDs back to the real photo URLs to display in the chat!
      const matchedPhotos = allPhotos.filter(p => data.photoIds?.includes(p.id));

      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.reply,
        photos: matchedPhotos 
      }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I lost my train of thought. Try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white ${isOpen ? 'hidden' : 'flex'} items-center justify-center`}
      >
        <Sparkles size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-full max-w-[380px] h-[550px] max-h-[80vh] glass-panel border border-purple-500/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-surfaceBorder flex justify-between items-center bg-surface/50">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sparkles className="text-purple-400" size={18} /> Memory AI
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Chat Bubble */}
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-surface border border-surfaceBorder text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Render Photos if AI found any */}
                  {msg.photos && msg.photos.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 max-w-[85%]">
                      {msg.photos.slice(0, 4).map(photo => (
                        <div 
                          key={photo.id} 
                          onClick={() => onPhotoClick && onPhotoClick(photo)}
                          className="aspect-square rounded-lg overflow-hidden border border-surfaceBorder cursor-zoom-in relative group"
                        >
                          <img src={photo.url} alt="Memory result" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon size={16} className="text-white" />
                          </div>
                        </div>
                      ))}
                      {msg.photos.length > 4 && (
                        <div className="aspect-square rounded-lg border border-surfaceBorder bg-surface flex items-center justify-center text-xs text-gray-400 font-bold">
                          +{msg.photos.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-surface border border-surfaceBorder text-gray-400 p-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-surfaceBorder bg-surface/30">
              <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your gallery..."
                  className="flex-1 bg-background border border-surfaceBorder rounded-full px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors pr-12"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-surfaceBorder text-white rounded-full transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}