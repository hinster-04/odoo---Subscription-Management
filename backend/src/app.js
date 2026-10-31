const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend service is healthy' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
