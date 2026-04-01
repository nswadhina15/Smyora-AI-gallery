import express from 'express';
import { generateSignature, deleteImage } from '../controllers/uploadController.js'; 

const router = express.Router();

// Route: GET /api/upload/signature
router.get('/signature', generateSignature);

// Route: POST /api/upload/delete
router.post('/delete', deleteImage);

export default router;