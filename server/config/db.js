const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  const uri = "mongodb+srv://undulemwakasungula:qwertyzxcv@cluster0.rfidwf5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 120000, // 2 minutes timeout
      socketTimeoutMS: 120000,
      maxPoolSize: 10,
      retryWrites: true
    });

    console.log(`MongoDB Connected to Cluster0: ${conn.connection.host}`.cyan.underline);
    
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to siliya database'.green);
    });

    mongoose.connection.on('error', (err) => {
      console.log(`Connection error: ${err.message}`.red);
    });

  } catch (error) {
    console.error(`Critical DB Error: ${error.message}`.red.underline.bold);
    console.error(error.stack); // Log full stack trace
    process.exit(1);
  }
};

module.exports = connectDB;