// backend/controllers/trainingController.js - COMPLETE WITH EMAIL NOTIFICATIONS

const Training = require('../models/Training');
const Course = require('../models/Course');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// @desc    Enroll in training course
// @route   POST /api/training/enroll
// @access  Private
exports.enrollInTraining = async (req, res) => {
  try {
    const { course, fullName, email, phone, educationLevel } = req.body;

    // Validation
    if (!course || !fullName || !email || !phone) {
      return res.status(400).json({ 
        message: 'Please provide all required fields' 
      });
    }

    // Create enrollment
    const enrollment = await Training.create({
      user: req.user.id,
      course,
      fullName,
      email,
      phone,
      educationLevel,
      status: 'pending'
    });

    // Populate course details
    await enrollment.populate('course');

    // Send confirmation email to student
    try {
      await sendEmail({
        to: email,
        subject: 'Training Enrollment Confirmed - Siliya Electricals',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2da0a8; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🎓 Enrollment Confirmed!</h1>
            </div>
            <div style="background-color: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">Hi ${fullName}!</h2>
              <p style="color: #666;">Thank you for enrolling in our training program. We're excited to help you develop your skills!</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2da0a8; margin-top: 0;">Enrollment Details:</h3>
                <p style="margin: 5px 0;"><strong>Enrollment ID:</strong> ${enrollment._id.toString().slice(-6)}</p>
                <p style="margin: 5px 0;"><strong>Course:</strong> ${course}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ff9800;">Pending Approval</span></p>
                <p style="margin: 5px 0;"><strong>Contact:</strong> ${phone}</p>
              </div>

              <h3 style="color: #333;">What happens next?</h3>
              <ol style="color: #666; line-height: 1.8;">
                <li>Our training coordinator will review your application within 48 hours</li>
                <li>You'll receive payment instructions and course schedule</li>
                <li>Complete payment to secure your spot</li>
                <li>Receive your course materials and start date</li>
              </ol>

              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1565c0;">
                  <strong>Important:</strong> Limited seats available. Complete your payment within 7 days of approval to guarantee your spot.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
                   style="background-color: #2da0a8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Enrollment Status
                </a>
              </div>

              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Questions? Contact us at siliyaelectricals@gmail.com or +265 887 408 386
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send enrollment confirmation email:', emailError);
    }

    // Notify admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: '🎓 New Training Enrollment',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2da0a8;">New Training Enrollment</h2>
              <p>A new student has enrolled:</p>
              <ul>
                <li><strong>ID:</strong> ${enrollment._id.toString().slice(-6)}</li>
                <li><strong>Name:</strong> ${fullName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Course:</strong> ${course}</li>
                <li><strong>Education:</strong> ${educationLevel || 'Not specified'}</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin.html" 
                 style="background-color: #2da0a8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View in Admin Panel
              </a>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to notify admin:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Enrollment successful',
      enrollmentId: enrollment._id.toString().slice(-6),
      _id: enrollment._id,
      enrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ 
      message: 'Error processing enrollment', 
      error: error.message 
    });
  }
};

// @desc    Get user's own enrollments
// @route   GET /api/training/my-enrollments
// @access  Private
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Training.find({ user: req.user.id })
      .populate('course')
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    console.error('Get my enrollments error:', error);
    res.status(500).json({ 
      message: 'Error fetching enrollments', 
      error: error.message 
    });
  }
};

// @desc    Get all enrollments (Admin)
// @route   GET /api/training/enrollments
// @access  Private/Admin
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Training.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments  // ✅ Wrapped in data property
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching enrollments', 
      error: error.message 
    });
  }
};

// @desc    Get all courses
// @route   GET /api/training/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses  // ✅ Wrapped in data property
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching courses', 
      error: error.message 
    });
  }
};

// @desc    Get single enrollment by ID (Admin)
// @route   GET /api/training/enrollments/:id
// @access  Private/Admin
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Training.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('course');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.status(200).json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ 
      message: 'Error fetching enrollment', 
      error: error.message 
    });
  }
};

// @desc    Update enrollment status (Admin)
// @route   PATCH /api/training/enrollments/:id/status
// @access  Private/Admin
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be: pending, approved, rejected, active, or completed' 
      });
    }

    const enrollment = await Training.findById(req.params.id)
      .populate('user')
      .populate('course');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const oldStatus = enrollment.status;
    enrollment.status = status;
    await enrollment.save();

    // Send status update email
    if (enrollment.email) {
      const statusColors = {
        'pending': '#ff9800',
        'approved': '#4caf50',
        'rejected': '#f44336',
        'active': '#2da0a8',
        'completed': '#673ab7'
      };

      const statusMessages = {
        'pending': 'Your enrollment is pending review.',
        'approved': 'Congratulations! Your enrollment has been approved.',
        'rejected': 'Unfortunately, your enrollment could not be approved at this time.',
        'active': 'Your course has started! Welcome to the program.',
        'completed': 'Congratulations on completing the course!'
      };

      try {
        await sendEmail({
          to: enrollment.email,
          subject: `Training Enrollment Update: ${status.toUpperCase()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: ${statusColors[status]}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Status Update</h1>
              </div>
              <div style="background-color: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333;">Hi ${enrollment.fullName}!</h2>
                <p style="color: #666; font-size: 16px;">${statusMessages[status]}</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Enrollment ID:</strong> ${enrollment._id.toString().slice(-6)}</p>
                  <p style="margin: 5px 0;"><strong>Course:</strong> ${enrollment.course?.name || enrollment.courseName}</p>
                  <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatus}</p>
                  <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: ${statusColors[status]}; font-weight: bold;">${status}</span></p>
                </div>

                ${status === 'approved' ? `
                  <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <h3 style="margin-top: 0; color: #2e7d32;">Next Steps:</h3>
                    <ol style="margin: 10px 0; padding-left: 20px; color: #2e7d32;">
                      <li>Complete payment within 7 days</li>
                      <li>Await payment confirmation</li>
                      <li>Receive course materials and schedule</li>
                    </ol>
                    <p style="margin: 10px 0 0 0; color: #2e7d32;">
                      <strong>Payment Details:</strong><br>
                      Contact us for payment information: +265 887 408 386
                    </p>
                  </div>
                ` : ''}

                ${status === 'active' ? `
                  <div style="background-color: #e1f5fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2da0a8;">
                    <p style="margin: 0; color: #0277bd;">
                      <strong>Your course has started!</strong><br>
                      Check your email for course materials and schedule details.
                    </p>
                  </div>
                ` : ''}

                ${status === 'completed' ? `
                  <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #673ab7;">
                    <p style="margin: 0; color: #4a148c;">
                      <strong>🎉 Congratulations!</strong><br>
                      Your certificate will be available for collection soon. We'll notify you when it's ready.
                    </p>
                  </div>
                ` : ''}

                ${status === 'rejected' ? `
                  <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                    <p style="margin: 0; color: #c62828;">
                      If you have questions about this decision, please contact us at siliyaelectricals@gmail.com or +265 887 408 386
                    </p>
                  </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
                     style="background-color: ${statusColors[status]}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Enrollment Details
                  </a>
                </div>

                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  Questions? Contact us at siliyaelectricals@gmail.com or +265 887 408 386
                </p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send enrollment status email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated',
      enrollment
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({ 
      message: 'Error updating enrollment status', 
      error: error.message 
    });
  }
};

// @desc    Delete enrollment (Admin)
// @route   DELETE /api/training/enrollments/:id
// @access  Private/Admin
exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Training.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await enrollment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ 
      message: 'Error deleting enrollment', 
      error: error.message 
    });
  }
};

// ============================
// COURSE MANAGEMENT
// ============================

// @desc    Get all courses
// @route   GET /api/training/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      message: 'Error fetching courses', 
      error: error.message 
    });
  }
};

// @desc    Get single course
// @route   GET /api/training/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ 
      message: 'Error fetching course', 
      error: error.message 
    });
  }
};

// @desc    Create course (Admin)
// @route   POST /api/training/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    const { name, description, duration, price, syllabus } = req.body;

    const course = await Course.create({
      name,
      description,
      duration,
      price,
      syllabus,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      message: 'Error creating course', 
      error: error.message 
    });
  }
};

// @desc    Update course (Admin)
// @route   PUT /api/training/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      message: 'Error updating course', 
      error: error.message 
    });
  }
};

// @desc    Delete course (Admin)
// @route   DELETE /api/training/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      message: 'Error deleting course', 
      error: error.message 
    });
  }
};

module.exports = exports;