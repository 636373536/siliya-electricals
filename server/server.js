// backend/server.js – RENDER-OPTIMIZED VERSION (Dec 2025)

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load env vars first
dotenv.config();

const app = express();

// ===========================
// DATABASE
// ===========================
connectDB();

// ===========================
// MIDDLEWARE
// ===========================

// CORS – works on Render + localhost
const corsOptions = {
  origin: [
    'https://siliya-electricals.onrender.com', // your Render URL
    'http://localhost:3000',
    'http://localhost:5000',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===========================
// ROUTES
// ===========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));
app.use('/api/training', require('./routes/trainingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// ===========================
// HEALTH CHECK (THIS FIXES "Disconnected")
// ===========================
app.get('/api/auth/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is alive and healthy!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ===========================
// 404 FOR API
// ===========================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
  });
});

// ===========================
// SPA FALLBACK – MUST BE LAST (before error handler)
// ===========================
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===========================
// ERROR HANDLER
// ===========================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ===========================
// START SERVER – RENDER COMPATIBLE
// ===========================
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('SERVER IS RUNNING');
  console.log(`Mode        : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port        : ${PORT}`);
  console.log(`Health URL  : https://your-service.onrender.com/api/auth/health`);
  console.log(`Frontend    : https://your-service.onrender.com`);
  console.log('='.repeat(60));
});

// Graceful shutdown (Render loves this)
process.on('SIGTERM', () => {
  console.log('SIGTERM received – shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB disconnected');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received – shutting down');
  server.close(() => process.exit(0));
});