const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const listModels = async () => {
    const key = process.env.GOOGLE_API_KEY;
    console.log("Using Key:", key ? key.substring(0, 5) + "..." : "MISSING");
    
    if (!key || key.includes('your_gemini_api_key_here')) {
        console.error("Please set a real GOOGLE_API_KEY in backend/.env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        // The SDK doesn't have a direct 'listModels' helper in the main class always, 
        // but we can try to hit the discovery endpoint or just try a broad model name.
        console.log("Checking available models...");
        
        // Let's try to initialize a model and check its metadata if possible, 
        // or just try common names one by one.
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro", "text-embedding-004"];
        
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                if (result) console.log(`✅ Model ${m} is WORKING.`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error("List Models Error:", error);
    }
};

listModels();
