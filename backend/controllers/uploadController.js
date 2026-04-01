import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with your secure credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const generateSignature = async (req, res) => {
  try {
    const folder = 'secure-ai-gallery';
    const timestamp = Math.round((new Date).getTime() / 1000);

    // NEW: Define the AI parameters
    const categorization = 'google_tagging';
    const auto_tagging = 0.6; // 60% confidence threshold

    // Pass the new parameters into the signature generator
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        categorization,
        auto_tagging
      },
      process.env.CLOUDINARY_API_SECRET
    );

    // Send the parameters back to the frontend so they can be appended to the form
    res.status(200).json({
      timestamp,
      signature,
      folder,
      categorization,
      auto_tagging,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });

  } catch (error) {
    console.error("Signature generation error:", error);
    res.status(500).json({ error: 'Failed to generate secure signature' });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body; // The Cloudinary ID of the image

    if (!publicId) {
      return res.status(400).json({ error: 'No public ID provided' });
    }

    // Tell Cloudinary to permanently destroy the asset
    const result = await cloudinary.uploader.destroy(publicId);

    // Cloudinary returns { result: 'ok' } if successful
    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image permanently deleted from cloud', result });
    } else {
      res.status(400).json({ error: 'Failed to delete from cloud', result });
    }
  } catch (error) {
    console.error("Deletion error:", error);
    res.status(500).json({ error: 'Internal server error during deletion' });
  }
};

