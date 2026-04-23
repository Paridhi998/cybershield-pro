const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const apiLimiter = require('../middleware/rateLimiter');

/**
 * @route POST /api/chat
 * @desc Get AI response for cybersecurity queries
 */
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const response = await aiService.getChatResponse(message);
    res.json({ response });

  } catch (error) {
    console.error("Chat Route Error:", error);
    res.status(500).json({ error: 'Internal server error while processing chat.' });
  }
});

module.exports = router;
