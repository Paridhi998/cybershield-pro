require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'cyber_guardian_secret_99',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
