const express = require('express');
const router = express.Router();
const assistantService = require('../services/assistantService');

const AI_ASSISTANT_ENABLED = process.env.AI_ASSISTANT_ENABLED !== 'false';

/**
 * @route POST /api/assistant/chat
 * @desc Get AI-powered cybersecurity advice
 */
router.post('/chat', async (req, res) => {
  if (!AI_ASSISTANT_ENABLED) {
    return res.status(503).json({ 
      error: 'AI Assistant Detached', 
      message: 'The AI Cybersecurity Assistant is currently disabled by system policy.' 
    });
  }

  try {
    const { message } = req.body;
    if (!message || message.length < 2) {
      return res.status(400).json({ error: 'Message is too short.' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message exceeds 500 character limit.' });
    }

    const reply = await assistantService.getAssistantReply(message);
    res.json({ reply });

  } catch (error) {
    console.error("Assistant Route Error:", error);
    res.status(500).json({ error: 'Server error processing chat.' });
  }
});

module.exports = router;
