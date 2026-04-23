const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const scanService = require('../services/scanService');
const apiLimiter = require('../middleware/rateLimiter');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
    }
  }
});

/**
 * @route POST /api/scan-image
 * @desc Extract text from image and analyze for scams
 */
router.post('/', apiLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }

    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      { logger: m => console.log(`OCR Progress: ${m.status} - ${Math.round(m.progress * 100)}%`) }
    );

    const extractedText = result.data.text;
    
    // Clean and Normalize Extracted Text
    const cleanText = extractedText
      .replace(/[^\w\s\n,.\/!?@#%&*()-]/g, '') // Remove noisy special characters
      .replace(/\s+/g, ' ')                  // Normalize whitespace
      .trim();
    
    if (!cleanText || cleanText.length < 5) {
      return res.status(400).json({ 
        error: 'No readable text detected. Please ensure the image is clear and contains a message.' 
      });
    }

    // Analyze extracted text using existing scanService
    const analysis = await scanService.analyzeText(cleanText);
    
    // Include extracted text in response for UI transparency
    res.json({
      ...analysis,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
    });

  } catch (error) {
    console.error("Image Scan Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error during image processing.' });
  }
});

module.exports = router;
