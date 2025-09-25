// server/controllers/paymentController.js
const Payment = require('../models/Payment');
const asyncHandler = require('express-async-handler');

const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({});
  res.json(payments);
});

module.exports = {
  getPayments
};