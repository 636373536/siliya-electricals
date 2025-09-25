const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get all courses
// @route   GET /api/training/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({});
  res.json(courses);
});

// @desc    Create new course
// @route   POST /api/training/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
  const { name, description, duration, price } = req.body;

  const course = new Course({
    name,
    description,
    duration,
    price,
    image: req.file ? req.file.filename : null,
  });

  const createdCourse = await course.save();
  res.status(201).json(createdCourse);
});

// @desc    Create new enrollment
// @route   POST /api/training/enroll
// @access  Private
const createEnrollment = asyncHandler(async (req, res) => {
  const { courseId, fullName, email, phone, educationLevel } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const enrollment = new Enrollment({
    user: req.user._id,
    course: courseId,
    fullName,
    email,
    phone,
    educationLevel,
  });

  const createdEnrollment = await enrollment.save();
  res.status(201).json(createdEnrollment);
});

// @desc    Get user enrollments
// @route   GET /api/training/enrollments
// @access  Private
const getUserEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id })
    .populate('course');
  res.json(enrollments);
});

module.exports = {
  getCourses,
  createCourse,
  createEnrollment,
  getUserEnrollments
};