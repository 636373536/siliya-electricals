// backend/routes/paymentRoutes.js - COMPLETE

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment
} = require('../controllers/paymentController');

// ===========================
// USER ROUTES (Protected)
// ===========================

// POST /api/payments - Create new payment
router.post('/', protect, createPayment);

// GET /api/payments/my-payments - Get user's own payments
router.get('/my-payments', protect, getMyPayments);

// GET /api/payments/:id - Get single payment (own or admin)
router.get('/:id', protect, getPaymentById);

// ===========================
// ADMIN ROUTES
// ===========================

// GET /api/payments - Admin gets all payments
router.get('/', protect, authorize('admin'), getAllPayments);

// PATCH /api/payments/:id/status - Admin updates payment status
router.patch('/:id/status', protect, authorize('admin'), updatePaymentStatus);

// DELETE /api/payments/:id - Admin deletes payment
router.delete('/:id', protect, authorize('admin'), deletePayment);

module.exports = router;