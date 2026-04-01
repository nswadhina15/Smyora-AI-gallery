import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import uploadRoutes from './routes/uploadRoutes.js';
import { analyzeChat, synthesizeAlbum, extractPhotoDNA, queryGallery } from './controllers/chatController.js';

dotenv.config();
console.log("🔑 Checking Razorpay Key:", process.env.RAZORPAY_KEY_ID);
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://smyora-ai-gallery.vercel.app'], 
  credentials: true
}));
app.use(express.json());

// ==========================================
// 💳 RAZORPAY PAYMENT ROUTES
// ==========================================
app.post('/api/checkout/razorpay', async (req, res) => {
  try {
    const { userId, email } = req.body;
    const options = {
      amount: 49900, // Amount in paise (499.00 INR)
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: userId,
        email: email,
        product: "Lumina - 100 Sparks"
      }
    };

    const order = await razorpayInstance.orders.create(options);
    
    res.status(200).json({ 
      success: true, 
      order, 
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

app.post('/api/checkout/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSignature) {
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

// ==========================================
// 📸 APP ROUTES
// ==========================================
app.use('/api/upload', uploadRoutes);
app.post('/api/chat/analyze', analyzeChat);
app.post('/api/chat/synthesize', synthesizeAlbum);
app.post('/api/vision/dna', extractPhotoDNA);
app.post('/api/chat/query', queryGallery);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Backend is running securely.' });
});

// ==========================================
// 🚀 START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Secure API Server running on port ${PORT}`);
});