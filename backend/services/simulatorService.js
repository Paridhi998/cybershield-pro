const aiService = require('./aiService');

/**
 * Simulator Service
 * Generates realistic AI-powered phishing scenarios for training.
 */
const generateScenario = async (type) => {
  const prompt = `
Generate a realistic interactive cybersecurity training scenario for the type: "${type}".
The response must be active, professional, and educational.

Return ONLY a valid JSON object:
{
  "title": "A short descriptive title",
  "sender": "Specific sender name or fake email",
  "content": "The actual message content (HTML supported for links)",
  "redFlags": ["Reason 1", "Reason 2", "Reason 3"],
  "isScam": true,
  "explanation": "A professional explanation of this specific threat"
}

Scenarios:
- "bank": Fake login alerts, suspicious withdrawals.
- "otp": Fake support asking for a security code.
- "whatsapp": Impersonating family members in trouble.
`;

  const responseText = await aiService.callGeminiAPI(prompt);
  
  if (!responseText) {
    return getFallbackScenario(type);
  }

  try {
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Scenario JSON Parse Error:", error.message);
    return getFallbackScenario(type);
  }
};

/**
 * Fallback static scenarios for offline or API issues.
 */
const getFallbackScenario = (type) => {
  const fallbacks = {
    bank: {
      title: "Suspicious Activity Detected",
      sender: "Security-Alert <no-reply@secure-bank-login.net>",
      content: "Your account has been restricted. Please <a href='#' class='sim-link'>verify your identity here</a> to avoid permanent closure.",
      redFlags: ["Urgent and threatening tone", "Suspicious sender domain (.net instead of .com)", "Link leads to an unknown domain"],
      isScam: true,
      explanation: "Banks will never threaten to close your account immediately via email. They use secure portals, not direct links for verification."
    },
    otp: {
      title: "Verification Required",
      sender: "System Mainframe",
      content: "Hello, I am from the IT support. We detected a login attempt. Please share the 6-digit OTP you just received to cancel it.",
      redFlags: ["Support asking for OTP (They never do)", "Unexpected contact", "Creating false sense of security"],
      isScam: true,
      explanation: "OTPs are 'One-Time Passwords'. Sharing them is essentially giving the keys to your account to someone else."
    },
    whatsapp: {
      title: "Family Emergency",
      sender: "+1 555-0102",
      content: "Hi Mom, my phone broke so I'm using this new number. I'm in a bit of a mess, can you please transfer $200 for a repair? I'll pay you back tonight x",
      redFlags: ["Unknown number claiming to be family", "Requesting money immediately", "Vague emergency story"],
      isScam: true,
      explanation: "This is a classic 'Hi Mom' scam. Always call the person's known number or verify through other means before sending money."
    }
  };
  return fallbacks[type] || fallbacks.bank;
};

module.exports = {
  generateScenario
};
