/**
 * VIN AI Messenger - Main Server
 * Facebook Messenger AI Bot with OpenRouter
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import routes
const webhookRoutes = require('./routes/webhook');

// Import database
const database = require('./database/database');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : '*',
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
database.initDatabase();

// Routes
app.use('/webhook', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Status page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VIN AI Messenger is running on port ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Status page: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing server...');
  process.exit(0);
});

module.exports = app;