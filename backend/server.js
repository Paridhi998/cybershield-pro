const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// -- DEBUG: Verify Environment Loading --
console.log('🔍 Environment Check:');
console.log('   - MONGO_URI:', process.env.MONGO_URI ? 'FOUND (Filtered)' : 'NOT FOUND');
const apiKey = process.env.GOOGLE_API_KEY || '';
const isPlaceholder = apiKey.includes('your_gemini_api_key_here');
console.log('   - GOOGLE_API_KEY:', apiKey ? (isPlaceholder ? 'PLACEHOLDER DETECTED ❌' : `FOUND (${apiKey.substring(0, 5)}...)`) : 'NOT FOUND ⚠️');
console.log('   - NODE_ENV:', process.env.NODE_ENV);

// -- 1. Configuration & Validation --
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!MONGO_URI) {
  console.error('❌ CRITICAL ERROR: MONGO_URI is not defined in .env');
  process.exit(1);
}

// -- 2. Database Connection (Resilient) --
const connectDB = async (retryCount = 5) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB');
    
    // -- Forensic Check: Find Corrupted Data --
    const User = require('./models/User');
    const corruptedCount = await User.countDocuments({ username: { $exists: false } });
    if (corruptedCount > 0) {
      console.warn(`🚨 DATA INTEGRITY ALERT: Found ${corruptedCount} user documents missing a username.`);
      console.warn(`   This is likely the cause of the "User validation failed" logs.`);
    }
  } catch (err) {
    if (retryCount > 0) {
      console.warn(`⚠️  MongoDB Connection failed. Retrying in 5s... (${retryCount} retries left)`);
      setTimeout(() => connectDB(retryCount - 1), 5000);
    } else {
      console.error('❌ CRITICAL: MongoDB connection failed after multiple attempts.');
      process.exit(1);
    }
  }
};

connectDB();

const app = express();

// -- 3. Security Middleware --
app.use(cors());
app.use(express.json());

// Global Rate Limiter (Prevents general DDoS/Spam)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

// -- 4. Route Mounting --
const scanRoutes = require('./routes/scan');
const scanImageRoutes = require('./routes/scanImage');
const authRoutes = require('./routes/auth');
const learnRoutes = require('./routes/learn');
const simulatorRoutes = require('./routes/simulator');
const assistantRoutes = require('./routes/assistant');


app.use('/api/scan', scanRoutes);
app.use('/api/scan-image', scanImageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/assistant', assistantRoutes);


// -- 5. Static Assets & SPA Routing --
app.use(express.static(path.join(__dirname, '../frontend')));

// Fine-tuned SPA Catch-all
app.get('*', (req, res) => {
  // If the request starts with /api but didn't match any route, return 404 JSON, not HTML
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// -- 6. Global Error Handler (Production Safe) --
app.use((err, req, res, next) => {
  console.error(`🔥 ERROR: ${err.message}`);
  
  const status = err.status || 500;
  const message = NODE_ENV === 'production' 
    ? 'An internal server error occurred' 
    : err.message;

  res.status(status).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// -- 7. Server Start --
const server = app.listen(PORT, () => {
  console.log(`
  🛡️  CyberShield AI - Production-Hardened
  --------------------------------------
  🚀 Status: Active
  🌐 Port:   ${PORT}
  🔗 Local:  http://localhost:${PORT}
  🛠️  Mode:   ${NODE_ENV}
  --------------------------------------
  `);
});

// -- 8. Graceful Shutdown --
const shutdown = () => {
  console.log('\n🛑 Shutdown signal received. Closing connections...');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('📦 MongoDB Disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
