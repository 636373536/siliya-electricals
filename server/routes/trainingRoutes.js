const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCourses,
  createCourse,
  createEnrollment,
  getUserEnrollments,
} = require('../controllers/trainingController');

router.route('/courses').get(getCourses).post(protect, createCourse);

router.route('/enroll').post(protect, createEnrollment);

router.get('/enrollments', protect, getUserEnrollments);

module.exports = router;