// seedAdmin.js
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env from project root
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found at:', envPath);
  process.exit(1);
}
dotenv.config({ path: envPath });

// DEBUG
console.log('Project Root:', __dirname);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'LOADED' : 'MISSING');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

// Import User model
let User;
try {
  User = require('./server/models/User');
} catch (err) {
  console.error('Failed to load User model:', err.message);
  process.exit(1);
}

// Create Admin
const createAdmin = async () => {
  const dbUri = process.env.MONGODB_URI;  // ← Use MONGODB_URI

  if (!dbUri) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB (Atlas)');

    const adminData = {
      name: process.env.ADMIN_NAME || 'Admin',
      email: process.env.ADMIN_EMAIL || 'siliyaelectrical2024@gmail.com',
      phone: process.env.ADMIN_PHONE || '1234567890',
      password: process.env.ADMIN_PASSWORD || 'siliya2024',
      role: 'admin',
    };

    await User.deleteOne({ email: adminData.email });
    const admin = await User.create(adminData);

    console.log('ADMIN CREATED SUCCESSFULLY');
    console.log({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
};

createAdmin();