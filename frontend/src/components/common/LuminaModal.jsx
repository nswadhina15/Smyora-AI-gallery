import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Zap, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { addSparksToUser } from '../../services/db';

export default function LuminaModal({ onClose }) {
  const { currentUser } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCheckout = async () => {
    setIsRedirecting(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });

      const response = await fetch('http://localhost:5000/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.uid,
          email: currentUser.email
        }),
      });

      const data = await response.json();
      
      if (!data.success) throw new Error("Order creation failed");

      const options = {
        key: data.key_id, 
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AI Gallery",
        description: "Lumina - 100 Sparks", 
        image: "https://cdn-icons-png.flaticon.com/512/6556/6556208.png", 
        order_id: data.order.id,
        // --- SECURE HANDLER STARTS HERE ---
        handler: async function (response) {
          try {
            // 1. Send payment details to our backend for security verification
            const verifyRes = await fetch('http://localhost:5000/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // 2. If backend says it's secure, update Firestore!
              await addSparksToUser(currentUser.uid, 100);
              
              alert("Payment Successful! 100 Sparks have been added to your Lumina Pass.");
              onClose(); // Close the modal
            } else {
              alert("Payment verification failed! Please contact support.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Something went wrong verifying your payment.");
          }
        },
        // --- SECURE HANDLER ENDS HERE ---
        prefill: {
          email: currentUser.email,
        },
        theme: {
          color: "#eab308" 
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed. Please try again.");
      });
      
      rzp.open();
      
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Payment system is currently connecting. Try again soon!");
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose} // <-- NEW: Clicking the dark background closes it
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()} // <-- NEW: Stops clicks inside the box from closing it
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-md relative overflow-hidden border border-yellow-500/30 rounded-3xl bg-background"
      >
        {/* Adjusted glows for Lumina theme */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Updated Close Button with higher z-index */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-50 p-2 bg-surface/80 rounded-full backdrop-blur-md transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 mb-6 relative">
            <Sparkles className="text-white" size={32} />
            <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              PRO
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Lumina</h2>
          <p className="text-gray-400 text-sm mb-8">Fuel your gallery with AI. Unlock the full power of your memories.</p>

          <div className="w-full bg-surface/40 border border-surfaceBorder rounded-2xl p-5 mb-8 text-left space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-yellow-500 shrink-0" />
              <span className="text-gray-200 text-sm">100 Sparks for AI Generations</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-yellow-500 shrink-0" />
              <span className="text-gray-200 text-sm">Alt Reality Dimension Warps</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-yellow-500 shrink-0" />
              <span className="text-gray-200 text-sm">Future Memory Predictions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-yellow-500 shrink-0" />
              <span className="text-gray-200 text-sm">Deep Chat Analytics</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={isRedirecting}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isRedirecting ? <Loader2 className="animate-spin" size={24} /> : <Zap size={20} fill="currentColor" />}
            {isRedirecting ? 'Connecting to Razorpay...' : 'Get 100 Sparks - ₹499'}
          </button>
          
          <div className="mt-4 flex items-center gap-1 text-gray-500 text-xs">
            <ShieldCheck size={14} /> Secured by Razorpay
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}