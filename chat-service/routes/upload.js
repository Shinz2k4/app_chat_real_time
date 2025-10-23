const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and common file types
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/zip'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload file/image endpoint
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 [UPLOAD] File upload request from:', req.user.username);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');
    
    console.log(`📤 [UPLOAD] Uploading ${isImage ? 'image' : 'file'}: ${file.originalname}, size: ${file.size} bytes`);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'auto',
        folder: isImage ? 'chat-app-images' : 'chat-app-files',
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
      };

      // Add transformation for images
      if (isImage) {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' }
        ];
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    console.log(`✅ [UPLOAD] Upload successful: ${result.secure_url}`);

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        type: isImage ? 'image' : 'file',
        name: file.originalname,
        size: file.size,
        format: result.format
      }
    });

  } catch (error) {
    console.error('❌ [UPLOAD] Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

module.exports = router;

