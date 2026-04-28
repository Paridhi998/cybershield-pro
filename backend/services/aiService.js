/**
 * CyberShield Local Analysis Service
 * (AI/Gemini features removed for maximum stability)
 */

/**
 * Optimized Local Pattern Matcher for Forensic Text Analysis
 */
const analyzeTextWithAI = async (text) => {
  const lowerText = text.toLowerCase();
  
  // Risk Categories
  const highRisk = ["password", "verify", "suspended", "bank", "crypto", "login", "credentials", "ssn", "social security", "pin code", "private key"];
  const medRisk = ["urgent", "winner", "prize", "gift card", "inherited", "lottery", "won", "claim", "lakh", "money", "cash", "dollars", "pounds", "unclaimed", "off"];
  
  const foundHigh = highRisk.filter(word => lowerText.includes(word));
  const foundMed = medRisk.filter(word => lowerText.includes(word));
  
  let score = 5;
  let verdict = "Safe";
  let reasons = ["No obvious scam patterns detected locally."];
  let explanation = "Message analyzed using protected local database. No high-risk signatures found.";

  if (foundHigh.length > 0) {
    score = 90;
    verdict = "Scam";
    reasons = [`High-risk scam signatures detected: ${foundHigh.join(", ")}`];
    explanation = "This message contains clear indicators of a phishing attempt to steal sensitive data.";
  } else if (foundMed.length > 0) {
    score = 75;
    verdict = "Suspicious";
    reasons = [`Common scam patterns detected: ${foundMed.join(", ")}`];
    explanation = "This message uses typical scam language (prizes, urgency, or monetary claims). Handle with extreme caution.";
  } else if (text.length > 500) {
    score = 40;
    verdict = "Suspicious";
    reasons = ["Message is unusually long, which is common in phishing emails."];
    explanation = "While no specific keywords were found, the length and structure are characteristic of modern phishing campaigns.";
  }

  return {
    source: "Shield Local Defense",
    score,
    verdict,
    reasons,
    explanation,
    isFallback: true // Indicated for UI awareness
  };
};

/**
 * Chatbot fallback (Assistant features removed)
 */
const getChatResponse = async (userMessage) => {
  return "AI Assistant features have been disabled. I am currently in Secure Local Mode. How can I help you with navigation?";
};

const callGeminiAPI = async () => null; // Placeholder for compatibility if needed

module.exports = { getChatResponse, analyzeTextWithAI, callGeminiAPI };
