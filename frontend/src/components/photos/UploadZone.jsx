import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import exifr from 'exifr';

export default function UploadZone({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const file = acceptedFiles[0];

      // NEW: Extract actual GPS data from the photo!
      let locationData = null;
      try {
        locationData = await exifr.gps(file); 
        // Returns { latitude: ..., longitude: ... } if GPS exists!
      } catch (err) {
        console.log("No GPS data found in this image.");
      }

      // 1. Fetch Cloudinary signature and parameters
      const signatureRes = await fetch('https://smyora-backend.onrender.com/api/upload/signature');
      if (!signatureRes.ok) throw new Error('Failed to fetch signature');
      
      const { 
        signature, 
        timestamp, 
        folder, 
        cloudName, 
        apiKey, 
        categorization, 
        auto_tagging 
      } = await signatureRes.json();

      // 2. Construct the form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      
      // 3. Safely append the AI instructions ONLY if the backend provided them
      if (categorization) formData.append('categorization', categorization);
      if (auto_tagging) formData.append('auto_tagging', auto_tagging);

      // 4. Upload directly to Cloudinary
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setUploadStatus('success');
        
        // NEW: Pass BOTH Cloudinary data AND location data to the Dashboard
        if (onUploadComplete) onUploadComplete(uploadData, locationData);
        
      } else {
        throw new Error(uploadData.error?.message || 'Upload failed');
      }

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  }, [onUploadComplete]);
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    disabled: isUploading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative border-2 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center text-center p-6 transition-all cursor-pointer overflow-hidden
        ${isDragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-surfaceBorder bg-surface/10 hover:bg-surface/20 hover:border-primary/50'}
        ${isUploading ? 'pointer-events-none opacity-80' : ''}
      `}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center text-primary"
          >
            <Loader2 size={40} className="animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white mb-1">Analyzing & Uploading...</h3>
            <p className="text-sm text-primary/80">Running AI Vision detection</p>
          </motion.div>
        ) : uploadStatus === 'success' ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center text-emerald-400"
          >
            <CheckCircle size={40} className="mb-4" />
            <h3 className="text-xl font-semibold text-white mb-1">Upload Complete</h3>
          </motion.div>
        ) : uploadStatus === 'error' ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center text-red-400"
          >
            <AlertCircle size={40} className="mb-4" />
            <h3 className="text-xl font-semibold text-white mb-1">Upload Failed</h3>
            <p className="text-sm">Check your console for details.</p>
          </motion.div>
        ) : (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragActive ? 'bg-primary text-white' : 'bg-surface text-primary'}`}>
              <UploadCloud size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragActive ? 'Drop your files here!' : 'Drag & Drop your photos here'}
            </h3>
            <p className="text-gray-400 max-w-sm text-sm">
              Support for JPG, PNG, and WebP. Images will be automatically optimized and AI-tagged.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}