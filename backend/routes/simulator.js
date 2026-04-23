const express = require('express');
const router = express.Router();
const simulatorService = require('../services/simulatorService');
const apiLimiter = require('../middleware/rateLimiter');

/**
 * @route GET /api/simulator/generate
 * @desc Get a random AI-powered phishing scenario
 */
router.get('/generate', apiLimiter, async (req, res) => {
  const { type } = req.query;
  
  if (!type) {
    return res.status(400).json({ error: 'Simulation type (bank, otp, whatsapp) is required.' });
  }

  try {
    const scenario = await simulatorService.generateScenario(type);
    res.json(scenario);
  } catch (error) {
    console.error("Route Error (Simulator):", error);
    res.status(500).json({ error: 'Internal server error during scenario generation.' });
  }
});

module.exports = router;
