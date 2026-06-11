require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'https://hrs.fortestaging.com',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

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
