const SCAM_KEYWORDS = [
  'urgent', 'otp', 'bank', 'blocked', 'suspended', 'immediately', 'verify', 'password',
  'winner', 'prize', 'claim', 'transfer', 'login', 'account', 'security', 'alert'
];

const aiService = require('./aiService');

const analyzeText = async (text) => {
  const local = runLocalDefense(text);
  const aiResult = await aiService.analyzeTextWithAI(text);
  
  if (aiResult) {
    return {
      ...aiResult,
      score: Math.max(aiResult.score, local.score),
      reasons: [...new Set([...aiResult.reasons, ...local.reasons])],
      source: 'CyberShield Smart AI'
    };
  }

  return { ...local, source: 'CyberShield Basic AI (Fallback)', isFallback: true };
};

const runLocalDefense = (text) => {
  if (!text) return { score: 0, verdict: 'Safe', reasons: [], explanation: 'No text provided.' };
  const lower = text.toLowerCase();
  let score = 0;
  let reasons = [];

  SCAM_KEYWORDS.forEach(word => {
    if (lower.includes(word)) {
      score += 15;
      reasons.push(`Pattern detected: ${word}`);
    }
  });

  score = Math.min(score, 95);
  let verdict = score >= 60 ? 'Scam' : (score >= 20 ? 'Suspicious' : 'Safe');

  return {
    score,
    verdict,
    reasons,
    explanation: `Heuristic scan identified ${score}% risk based on common patterns.`
  };
};

module.exports = { analyzeText };
