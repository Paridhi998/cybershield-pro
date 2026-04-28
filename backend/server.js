const path = require('path');
require('dotenv').config();

// -- 1. Clean Environment Verification 
const apiKey = process.env.GEMINI_API_KEY;
console.log("🔍 AI ENGINE STATUS:");
if (!apiKey) {
  console.log("❌ GEMINI_API_KEY NOT FOUND in .env");
} else {
  console.log(`✅ GEMINI_API_KEY LOADED (${apiKey.substring(0, 5)}...)`);
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// -- 2. Configuration & Validation --
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!MONGO_URI) {
  console.error('❌ CRITICAL ERROR: MONGO_URI is not defined in .env');
  process.exit(1);
}

// -- 3. Database Connection (Resilient) --
const connectDB = async (retryCount = 5) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB');

    const User = require('./models/User');
    const corruptedCount = await User.countDocuments({ username: { $exists: false } });
    if (corruptedCount > 0) {
      console.warn(`🚨 DATA INTEGRITY ALERT: Found ${corruptedCount} user documents missing a username.`);
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

// -- 4. Security Middleware --
app.use(cors({
  origin: "*", // Or specific array like ["https://your-netlify-url.netlify.app", "http://localhost:5000"] if you want strict security, but * ensures it works initially
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-auth-token"]
}));
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Increased from 100 to allow smooth scanner usage
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

// -- 5. Route Mounting --
const scanRoutes = require('./routes/scan');
const scanImageRoutes = require('./routes/scanImage');
const authRoutes = require('./routes/auth');
const learnRoutes = require('./routes/learn');
const simulatorRoutes = require('./routes/simulator');


app.use('/api/scan', scanRoutes);
app.use('/api/scan-image', scanImageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/simulator', simulatorRoutes);


// Root Health Check Route
app.get('/', (req, res) => {
  res.send('✅ CyberShield backend is running!');
});

// -- 6. Static Assets & SPA Routing --
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// -- 7. Global Error Handler --
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

// -- 8. Server Start --
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

// -- 9. Graceful Shutdown --
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
