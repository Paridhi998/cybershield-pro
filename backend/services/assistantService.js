const config = require("../config/env");

/**
 * AI Assistant Service - Dedicated Cybersecurity Intelligence
 */
const getAssistantReply = async (userMessage) => {
  if (!config.GOOGLE_API_KEY || config.GOOGLE_API_KEY.includes('your_gemini_api_key')) {
    return "⚠️ AI Assistant is currently in offline mode due to a missing API Key.";
  }

  const SYSTEM_PROMPT = `
    You are a cybersecurity expert AI assistant for CyberShield AI.
    Explain scams, phishing, OTP frauds, and online threats in simple, helpful language.
    
    GUIDELINES:
    1. Be practical and clear.
    2. If unsure, say you are not certain.
    3. Maximum length: 3 sentences.
    4. Never ask for personal info.

    EXAMPLES:
    User: "I got an OTP message I didn't request."
    AI: "This is likely a 'SIM Swapping' or 'Account Takeover' attempt. Never share that OTP with anyone, even if they claim to be from your bank."
    
    User: "Is this link safe?"
    AI: "Check if the domain is correctly spelled and uses HTTPS. If it's a shortened link (like bit.ly) from an unknown sender, it's safer not to click."
  `;

  const payload = {
    contents: [
      {
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}` }]
      }
    ]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${config.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Failure");

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please try again.";
  } catch (error) {
    console.error("Assistant Service Error:", error.message);
    return "⚠️ AI Assistant unavailable right now. Please try again later.";
  }
};

module.exports = { getAssistantReply };
