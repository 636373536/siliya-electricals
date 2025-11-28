const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Course, Training } = require('../models/Training');

// ===========================
// PUBLIC ROUTES
// ===========================

// @desc    Get all active courses
// @route   GET /api/training/courses
// @access  Public
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: err.message,
    });
  }
});

// @desc    Get single course by ID
// @route   GET /api/training/courses/:id
// @access  Public
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: err.message,
    });
  }
});

// ===========================
// USER ROUTES (Protected)
// ===========================

// @desc    Enroll in training course
// @route   POST /api/training
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { course, fullName, email, phone, educationLevel } = req.body;

    if (!course || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const enrollment = new Training({
      user: req.user._id,
      course,
      fullName,
      email,
      phone,
      educationLevel: educationLevel || 'secondary',
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Enrollment successful',
      enrollmentId: enrollment._id.toString().slice(-6),
      _id: enrollment._id,
      data: enrollment,
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing enrollment',
      error: err.message,
    });
  }
});

// @desc    Alias for enrollment - POST /api/training/enroll
// @route   POST /api/training/enroll
// @access  Private
router.post('/enroll', protect, async (req, res) => {
  try {
    const { course, fullName, email, phone, educationLevel } = req.body;

    if (!course || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const enrollment = new Training({
      user: req.user._id,
      course,
      fullName,
      email,
      phone,
      educationLevel: educationLevel || 'secondary',
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Enrollment successful',
      enrollmentId: enrollment._id.toString().slice(-6),
      _id: enrollment._id,
      data: enrollment,
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing enrollment',
      error: err.message,
    });
  }
});

// @desc    Get user's enrollments
// @route   GET /api/training/my-enrollments
// @access  Private
router.get('/my-enrollments', protect, async (req, res) => {
  try {
    const enrollments = await Training.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (err) {
    console.error('Get my enrollments error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: err.message,
    });
  }
});

// ===========================
// ADMIN ROUTES
// ===========================

// @desc    Get all enrollments (Admin) - MAIN ENDPOINT
// @route   GET /api/training/enrollments
// @access  Private/Admin
router.get('/enrollments', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollments = await Training.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (err) {
    console.error('Get all enrollments error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: err.message,
    });
  }
});

// @desc    Get single enrollment (Admin)
// @route   GET /api/training/enrollments/:id
// @access  Private/Admin
router.get('/enrollments/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollment = await Training.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (err) {
    console.error('Get enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
      error: err.message,
    });
  }
});

// @desc    Update enrollment status (Admin)
// @route   PATCH /api/training/enrollments/:id
// @access  Private/Admin
router.patch('/enrollments/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const enrollment = await Training.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment,
    });
  } catch (err) {
    console.error('Update enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment',
      error: err.message,
    });
  }
});

// @desc    Delete enrollment (Admin)
// @route   DELETE /api/training/enrollments/:id
// @access  Private/Admin
router.delete('/enrollments/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollment = await Training.findByIdAndDelete(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (err) {
    console.error('Delete enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting enrollment',
      error: err.message,
    });
  }
});

// @desc    Create course (Admin)
// @route   POST /api/training/courses
// @access  Private/Admin
router.post('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, duration, price, image, syllabus, level } = req.body;

    if (!name || !description || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const course = new Course({
      name,
      description,
      duration,
      price,
      image,
      syllabus: syllabus || [],
      level: level || 'beginner',
      isActive: true,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: err.message,
    });
  }
});

// @desc    Update course (Admin)
// @route   PUT /api/training/courses/:id
// @access  Private/Admin
router.put('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: err.message,
    });
  }
});
// @desc    Update enrollment status (Admin) - MAIN ENDPOINT
// @route   PATCH /api/training/enrollments/:id/status
// @access  Private/Admin
router.patch('/enrollments/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const enrollment = await Training.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated',
      data: enrollment
    });
  } catch (err) {
    console.error('Update enrollment status error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: err.message
    });
  }
});

// @desc    Delete course (Admin)
// @route   DELETE /api/training/courses/:id
// @access  Private/Admin
router.delete('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course deactivated successfully',
      data: course,
    });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: err.message,
    });
  }
});

module.exports = router;