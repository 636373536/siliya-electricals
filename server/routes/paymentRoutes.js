const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, admin, paymentController.getPayments);

module.exports = router;