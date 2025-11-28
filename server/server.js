// backend/server.js - COMPLETE SERVER CONFIGURATION

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables FIRST
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===========================
// MIDDLEWARE
// ===========================

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===========================
// ROUTE FILES
// ===========================
const authRoutes = require('./routes/authRoutes');
const repairRoutes = require('./routes/repairRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// ===========================
// MOUNT ROUTERS (Order matters!)
// ===========================
app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ===========================
// 404 HANDLER FOR API ROUTES
// ===========================
app.use('/api/*', (req, res) => {
  console.error(`❌ 404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: {
      auth: [
        'POST /api/auth/signup',
        'POST /api/auth/login',
        'GET /api/auth/profile',
        'GET /api/auth/users (admin)',
        'DELETE /api/auth/users/:id (admin)'
      ],
      repairs: [
        'POST /api/repairs',
        'GET /api/repairs/my-repairs',
        'GET /api/repairs (admin)',
        'PATCH /api/repairs/:id/status (admin)',
        'GET /api/repairs/:id/status'
      ],
      training: [
        'GET /api/training/courses',
        'POST /api/training/enroll',
        'GET /api/training/my-enrollments',
        'GET /api/training/enrollments (admin)',
        'PATCH /api/training/enrollments/:id/status (admin)'
      ]
    }
  });
});

// ===========================
// SPA FALLBACK (Must be AFTER all API routes!)
// ===========================
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===========================
// ERROR HANDLER (Must be last!)
// ===========================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// ===========================
// GRACEFUL ERROR HANDLING
// ===========================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
