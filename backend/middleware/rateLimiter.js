const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after a minute.'
  }
});

module.exports = apiLimiter;
