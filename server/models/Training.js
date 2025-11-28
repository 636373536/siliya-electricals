const mongoose = require('mongoose');

// Course Schema
const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a course name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    duration: {
      type: String, // e.g., "8 Weeks"
      required: [true, 'Please provide duration'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
    image: {
      type: String,
      default: null,
    },
    syllabus: [String],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: String, // Store course name directly for flexibility
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
    },
    educationLevel: {
      type: String,
      enum: ['secondary', 'diploma', 'degree', 'other'],
      default: 'secondary',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    enrolledDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create models
const Course = mongoose.model('Course', courseSchema);
const Training = mongoose.model('Training', enrollmentSchema);

module.exports = { Course, Training };