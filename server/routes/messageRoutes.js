// backend/routes/messageRoutes.js - COMPLETE

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Simple message routes (can be expanded later)

// @desc    Send message/contact form
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Please provide name, email, and message' 
      });
    }

    // For now, just log and send success
    console.log('📧 Message received:', { name, email, subject });

    // You can add email notification here later
    // await sendEmail({ ... });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully. We will contact you soon.'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
});

// @desc    Get all messages (Admin)
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Placeholder - can implement database storage later
    res.status(200).json({
      success: true,
      messages: [],
      message: 'Messages feature coming soon'
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      message: 'Error fetching messages', 
      error: error.message 
    });
  }
});

module.exports = router;