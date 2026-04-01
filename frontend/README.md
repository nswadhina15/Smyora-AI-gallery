# 🌌 Smyora

> **Stories that stay with you.**

Smyora is a next-generation, full-stack AI photo gallery and memory vault. It goes beyond simple photo storage by offering **Alt-Reality dimension warping**, **AI memory synthesis**, and a built-in premium token economy ("Sparks") powered by Razorpay.

## ✨ Key Features

- **🔐 Secure Photo Vault:** Upload, tag, and organize memories safely using Firebase.
- **🌀 Alt-Reality Studio:** Tear the fabric of reality. Uses Cloudinary Generative AI to completely replace photo backgrounds (Anime, Cyberpunk, Ghibli, etc.).
- **🧠 Memory Synthesis:** Analyzes the tags and context of your photo albums to generate custom, poetic summaries of your memories.
- **⚡ The "Sparks" Economy:** A fully functioning micro-transaction system. Users spend "Sparks" to perform AI generations.
- **💎 Lumina Premium Tier:** Integrated Razorpay payment gateway with cryptographic signature verification for users to purchase more Sparks securely.

## 🛠️ Tech Stack

**Frontend:**

- React (Vite)
- Tailwind CSS (Styling & Glassmorphism UI)
- Framer Motion (Advanced animations)
- React Router (Navigation)

**Backend & Infrastructure:**

- Node.js & Express (REST API)
- Firebase Authentication (Secure login/signup)
- Firebase Firestore (NoSQL Database for users, photos, and Spark balances)
- Cloudinary API (Image hosting & Generative AI Background Replacement)
- Razorpay (Payment processing & secure webhook verification)

---

## 🚀 Local Setup & Installation

Follow these steps to get a local copy of Smyora up and running.

### 1. Clone the repository

```bash
git clone [https://github.com/YOUR_USERNAME/smyora-ai-gallery.git](https://github.com/YOUR_USERNAME/smyora-ai-gallery.git)
cd smyora-ai-gallery

### 2. Frontend Setup
Open a terminal and navigate to the frontend directory:

cd frontend
npm install

Create a .env.local file in the frontend folder and add your Firebase and Vite config keys:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

Start the Vite development server:
npm run dev

### 3. Backend Setup
Open a second terminal and navigate to the backend directory:
cd backend
npm install

Create a .env file in the backend folder and add your Razorpay keys:
PORT=5000
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_secret_here

Start the Node.js server:
npm run dev
# or: node index.js

### 💳 Testing Payments
The app is currently configured to use Razorpay Test Mode. When the Lumina Upgrade modal appears, click "Get 100 Sparks" and use the official Razorpay test credentials (any random 10-digit mobile number, and the test card provided in the Razorpay UI) to simulate a successful transaction.

🔮 Future Roadmap
[ ] Implement Face Recognition & auto-tagging

[ ] Add collaborative "Shared Albums" with real-time syncing

[ ] Export "Memory Story" slideshows as video files

***

### How to add it:
1. Copy the code block above.
2. In your VS Code (in the root folder), create a file named `README.md`.
3. Paste the text in and save it.
4. Run your Git commands (`git add README.md`, `git commit -m "Added README"`, `git push origin main`).

Once it's pushed, GitHub will automatically render it as the beautiful front page of your repository!
```
