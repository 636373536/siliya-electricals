const express = require('express');
const {
  getPayments,
  createPayment,
  updatePayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/', protect, createPayment);

// Admin only routes
router.get('/', protect, authorize('admin'), getPayments);
router.patch('/:id', protect, authorize('admin'), updatePayment);

module.exports = router;