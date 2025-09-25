const mongoose = require('mongoose');
const config = require('../config/config.env');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_STRING || config.DB_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Import models
const User = require('./User');
const Message = require('./Message');
const Payment = require('./Payment');
const Repair = require('./Repair');
const Training = require('./Training');
const Product = require('./Product');
const Order = require('./Order');

// Export models and connection function
module.exports = {
  connectDB,
  User,
  Message,
  Payment,
  Repair,
  Training,
  Product,
  Order
};