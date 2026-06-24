require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimit = require('express-rate-limit');

const app = express();

app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'https://hrs.fortestaging.com',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/api/auth/microsoft', authLimiter);

app.use('/api', routes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;
