const generateScenario = async (type) => {
  return getFallbackScenario(type);
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
