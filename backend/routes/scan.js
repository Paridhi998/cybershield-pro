const express = require('express');
const router = express.Router();
const scanService = require('../services/scanService');
const apiLimiter = require('../middleware/rateLimiter');

/**
 * @route POST /api/scan
 * @desc Analyze text for potential scams
 */
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const analysis = await scanService.analyzeText(message);
    res.json(analysis);

  } catch (error) {
    console.error("Scan Route Error:", error);
    res.status(500).json({ error: 'Internal server error while scanning.' });
  }
});

module.exports = router;
