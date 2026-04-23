const config = require("../config/env");

/**
 * Utility: Wait for X milliseconds (for retries)
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Circuit Breaker State (Prevents request flooding during AI downtime)
 */
const circuitState = {
  isSuspended: false,
  suspendedUntil: 0,
  reason: ""
};

/**
 * Hardened Gemini API Handler with Multi-Model Waterfall
 * Tries Gemini 2.0 Flash first, falls back to 1.5 Flash if rate-limited.
 */
const callGeminiAPI = async (prompt) => {
  // Check Circuit Breaker
  if (circuitState.isSuspended) {
    if (Date.now() < circuitState.suspendedUntil) {
      console.warn(`🔒 AI Engine: Suspended until ${new Date(circuitState.suspendedUntil).toLocaleTimeString()} (${circuitState.reason})`);
      return null;
    }
    circuitState.isSuspended = false;
  }

  if (!config.GOOGLE_API_KEY || config.GOOGLE_API_KEY.includes('your_gemini_api_key')) {
    console.warn("🛡️ AI Engine: API Key missing. Falling back to Heuristics.");
    return null;
  }

  const API_VERSION = 'v1beta';
  const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"]; 
  
  for (const model of MODELS) {
    let attempt = 0;
    const maxRetries = 1; // 1 retry per model before moving to next model

    while (attempt <= maxRetries) {
      try {
        console.log(`🤖 AI Engine: Processing with ${model} (Attempt ${attempt + 1})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${config.GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (response.ok) {
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) throw new Error("Empty AI Response");
          return rawText;
        }

        const status = response.status;
        const errorMsg = data.error?.message || "Unknown error";

        // Handle 404/403: Move to next model immediately
        if (status === 404 || status === 403) {
          console.warn(`⚠️ AI Engine: ${model} unavailable (${status}). Switching waterfall...`);
          break; 
        }

        // Handle 429: Wait and then either retry or move to next model
        if (status === 429) {
          console.warn(`⚠️ AI Engine: ${model} Rate Limited. Quota exhausted.`);
          if (attempt < maxRetries) {
            await wait(2000);
            attempt++;
            continue;
          }
          console.warn(`⏭️ AI Engine: Quota for ${model} hit max. Trying next model...`);
          break; 
        }

        // Handle 5xx
        if (status >= 500 && attempt < maxRetries) {
          await wait(1000);
          attempt++;
          continue;
        }

        throw new Error(`API Error ${status}: ${errorMsg}`);

      } catch (error) {
        console.error(`❌ AI Engine Error (${model}):`, error.message);
        if (attempt < maxRetries) {
          attempt++;
          await wait(1000);
          continue;
        }
        break; // Move to next model
      }
    }
  }

  // All models failed: Trip the breaker
  console.error("🚨 AI Engine: All models exhausted/failed. Tripping Circuit Breaker.");
  circuitState.isSuspended = true;
  circuitState.suspendedUntil = Date.now() + 60000; // 1 Minute cooldown
  circuitState.reason = "Waterfall Failure / Global Quota Hit";
  return null;
};

/**
 * AI Service for Cybersecurity Chat interactions
 */
const getChatResponse = async (userMessage) => {
  const prompt = `You are CyberShield AI (Cybersecurity Expert). Be concise. Text: ${userMessage}`;
  const response = await callGeminiAPI(prompt);
  return response || "I'm currently in high-security fallback mode. [Local Defense Active]";
};

/**
 * AI Service for Forensic Text Analysis
 */
const analyzeTextWithAI = async (text) => {
  const prompt = `
    Analyze this text for scam risks. 
    RETURN ONLY JSON: {"score": number, "verdict": "Safe"|"Suspicious"|"Scam", "reasons": ["string"], "explanation": "string"}
    TEXT: "${text}"
  `;

  const responseText = await callGeminiAPI(prompt);
  if (!responseText) return null;

  try {
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI JSON Parse Error:", error.message);
    return null;
  }
};

module.exports = { getChatResponse, analyzeTextWithAI, callGeminiAPI };
