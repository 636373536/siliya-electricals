// backend/controllers/paymentController.js - COMPLETE PAYMENT CONTROLLER

const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/email');

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { amount, method, reference, description } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ 
        message: 'Please provide amount and payment method' 
      });
    }

    const payment = await Payment.create({
      user: req.user.id,
      amount,
      method,
      reference,
      description,
      status: 'pending'
    });

    // Send payment confirmation email
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Payment Received - Siliya Electricals',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2da0a8;">Payment Confirmation</h2>
            <p>Hi ${req.user.name},</p>
            <p>We've received your payment:</p>
            <ul>
              <li><strong>Amount:</strong> K${amount.toLocaleString()}</li>
              <li><strong>Method:</strong> ${method}</li>
              <li><strong>Reference:</strong> ${reference || 'N/A'}</li>
              <li><strong>Status:</strong> Pending verification</li>
            </ul>
            <p>We'll notify you once the payment is confirmed.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ 
      message: 'Error recording payment', 
      error: error.message 
    });
  }
};

// @desc    Get user's own payments
// @route   GET /api/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ 
      message: 'Error fetching payments', 
      error: error.message 
    });
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ 
      message: 'Error fetching payments', 
      error: error.message 
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment or is admin
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to view this payment' 
      });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      message: 'Error fetching payment', 
      error: error.message 
    });
  }
};

// @desc    Update payment status (Admin)
// @route   PATCH /api/payments/:id/status
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be: pending, confirmed, failed, or refunded' 
      });
    }

    const payment = await Payment.findById(req.params.id).populate('user');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const oldStatus = payment.status;
    payment.status = status;
    await payment.save();

    // Send status update email
    if (payment.user && payment.user.email) {
      const statusColors = {
        'pending': '#ff9800',
        'confirmed': '#4caf50',
        'failed': '#f44336',
        'refunded': '#2196f3'
      };

      const statusMessages = {
        'pending': 'Your payment is being processed.',
        'confirmed': 'Your payment has been confirmed!',
        'failed': 'Your payment could not be processed.',
        'refunded': 'Your payment has been refunded.'
      };

      try {
        await sendEmail({
          to: payment.user.email,
          subject: `Payment Status Update: ${status.toUpperCase()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: ${statusColors[status]}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Payment Update</h1>
              </div>
              <div style="background-color: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333;">Hi ${payment.user.name}!</h2>
                <p style="color: #666; font-size: 16px;">${statusMessages[status]}</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${payment._id.toString().slice(-6)}</p>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> K${payment.amount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Method:</strong> ${payment.method}</p>
                  <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatus}</p>
                  <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: ${statusColors[status]}; font-weight: bold;">${status}</span></p>
                </div>

                ${status === 'confirmed' ? `
                  <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <p style="margin: 0; color: #2e7d32;">
                      <strong>✓ Payment Confirmed</strong><br>
                      Your transaction has been successfully processed. Thank you!
                    </p>
                  </div>
                ` : ''}

                ${status === 'failed' ? `
                  <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                    <p style="margin: 0; color: #c62828;">
                      <strong>Payment Failed</strong><br>
                      Please contact us if you believe this is an error: +265 887 408 386
                    </p>
                  </div>
                ` : ''}

                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  Questions? Contact us at siliyaelectricals@gmail.com or +265 887 408 386
                </p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send payment status email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated',
      payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      message: 'Error updating payment status', 
      error: error.message 
    });
  }
};

// @desc    Delete payment (Admin)
// @route   DELETE /api/payments/:id
// @access  Private/Admin
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ 
      message: 'Error deleting payment', 
      error: error.message 
    });
  }
};

module.exports = exports;