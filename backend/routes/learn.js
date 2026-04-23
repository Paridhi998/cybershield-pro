const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

// Master Module Data (Server-Side Source of Truth)
const MODULES = [
  { id: 1, title: "Digital Foundations", icon: "🛡️", xp: 100, 
    quiz: { q: "Which of these is the MOST common initial vector for an attack?", o: ["Social Engineering", "Hardware fail", "Power outage", "Solar flares"], c: 0 }
  },
  { id: 2, title: "The Art of Phishing", icon: "🎣", xp: 150,
    quiz: { q: "What is the primary psychological trigger used in phishing?", o: ["Happiness", "Boredom", "Urgency/Panic", "Confusion"], c: 2 }
  },
  { id: 3, title: "Bulletproof Credentials", icon: "🔑", xp: 150,
    quiz: { q: "Does MFA make your account 100% unhackable?", o: ["Yes", "No (It's safer, but not 'unhackable')"], c: 1 }
  },
  { id: 4, title: "Cyber Guardian", icon: "💎", xp: 200,
    quiz: { q: "What if you accidentally click a suspicious link?", o: ["Ignore it", "Disconnect, change passwords, scan for malware", "Restart and forget"], c: 1 }
  }
];

const XP_THRESHOLDS = [0, 150, 350, 600]; // Level 1, 2, 3, 4

/**
 * @route GET /api/learn/status
 * @desc Get user academy progress
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('xp level completedModules badges');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /api/learn/complete-module
 * @desc Validate quiz and award progress
 */
router.post('/complete-module', [auth, apiLimiter], async (req, res) => {
  const { moduleId, answerIndex } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Validation: Already completed?
    if (user.completedModules.includes(moduleId)) {
      return res.status(400).json({ error: 'Module already completed' });
    }

    // 2. Validation: Correct order?
    const modIndex = MODULES.findIndex(m => m.id === moduleId);
    if (modIndex > 0) {
      const prevMod = MODULES[modIndex - 1];
      if (!user.completedModules.includes(prevMod.id)) {
        return res.status(400).json({ error: 'Complete previous modules first' });
      }
    }

    // 3. Validation: Correct answer?
    const moduleData = MODULES[modIndex];
    if (answerIndex !== moduleData.quiz.c) {
      return res.status(400).json({ error: 'Incorrect answer' });
    }

    // 4. Logic: Award XP
    user.completedModules.push(moduleId);
    user.xp += moduleData.xp;

    // 5. Logic: Level Up
    let newLevel = user.level;
    while (newLevel < XP_THRESHOLDS.length && user.xp >= XP_THRESHOLDS[newLevel]) {
      newLevel++;
    }
    user.level = newLevel;

    await user.save();

    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      completedModules: user.completedModules,
      newLevelAchieved: newLevel > (user.level - 1) // Simple flag
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
