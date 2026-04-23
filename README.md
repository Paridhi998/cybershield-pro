# 🛡️ CyberShield AI - Smart Cybersecurity Simulator

CyberShield AI is a full-stack educational platform designed to help users identify scams, experiment with realistic simulations, and get real-time cybersecurity advice from an AI assistant.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed on your system.
- **Google Gemini API Key**: (Optional but recommended) To use the AI Chatbot, get a key from the [Google AI Studio](https://aistudio.google.com/).

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` folder (or copy `.env.example`):
```bash
PORT=5000
GOOGLE_API_KEY=your_actual_api_key_here
```
*Note: If no API key is provided, the chatbot will use a built-in security knowledge base.*

### 4. Run the Application
Start the server:
```bash
node server.js
```

### 5. Access the Platform
Open your browser and go to:
**http://localhost:5000**

---

## 🛠️ Project Structure

- **`backend/`**: Express.js server with clean modular architecture.
    - `routes/`: API endpoints for scanning and chat.
    - `services/`: Core logic for scam detection and AI integration.
    - `middleware/`: Security rate-limiting.
- **`frontend/`**: Vanilla HTML/CSS/JS with a modern "Hacker" aesthetic.
    - `index.html`: Main UI structure.
    - `style.css`: Custom animations and dark-mode styling.
    - `app.js`: Interactive simulation and API handling.

---

## ✨ Features
- **Smart Scanner**: Detects scams using keyword analysis and urgency detection.
- **Advanced Simulator**: Realistic interactive runs for Bank Phishing, OTP Fraud, and WhatsApp scams.
- **AI Assistant**: Cybersecurity-focused chatbot with Google Gemini integration and local fallback.
- **Security**: Built-in rate limiting to prevent API abuse.

---
*Disclaimer: This project is for educational purposes only. Always use official channels for sensitive financial transactions.*
