const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Repair = require('../models/Repair');
const { protect, authorize } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/repairs/'),
  filename: (req, file, cb) => {
    cb(null, `repair-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ===========================
// PUBLIC/USER ROUTES
// ===========================

// @desc    Create repair request
// @route   POST /api/repairs
// @access  Private
router.post('/', protect, upload.array('photos', 3), async (req, res) => {
  try {
    const { deviceType, brand, model, issue } = req.body;
    const photos = req.files?.map(f => `/uploads/repairs/${f.filename}`) || [];

    if (!deviceType || !issue) {
      return res.status(400).json({ 
        success: false,
        message: 'Device type and issue description are required' 
      });
    }

    const repair = new Repair({
      deviceType,
      brand: brand || '',
      model: model || '',
      issue,
      photos,
      customer: req.user.name || 'Unknown',
      userId: req.user._id,
      status: 'pending',
      createdAt: new Date()
    });

    const savedRepair = await repair.save();

    res.status(201).json({
      success: true,
      message: 'Repair request submitted successfully',
      repairId: savedRepair._id.toString().slice(-6),
      _id: savedRepair._id,
      data: savedRepair
    });
  } catch (err) {
    console.error('Create repair error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating repair request',
      error: err.message 
    });
  }
});

// @desc    Get user's own repairs
// @route   GET /api/repairs/my-repairs
// @access  Private
router.get('/my-repairs', protect, async (req, res) => {
  try {
    const repairs = await Repair.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: repairs.length,
      data: repairs
    });
  } catch (err) {
    console.error('Get user repairs error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your repairs',
      error: err.message 
    });
  }
});

// ===========================
// ADMIN ROUTES
// ===========================

// @desc    Get all repairs
// @route   GET /api/repairs
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const repairs = await Repair.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: repairs.length,
      data: repairs
    });
  } catch (err) {
    console.error('Get all repairs error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching repairs',
      error: err.message 
    });
  }
});

// @desc    Get single repair
// @route   GET /api/repairs/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    res.status(200).json({
      success: true,
      data: repair
    });
  } catch (err) {
    console.error('Get repair error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching repair',
      error: err.message 
    });
  }
});

// @desc    Update repair status - MAIN ENDPOINT FOR ADMIN
// @route   PATCH /api/repairs/:id/status
// @access  Private/Admin
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, in-progress, completed, or cancelled'
      });
    }

    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Repair status updated successfully',
      data: repair
    });
  } catch (err) {
    console.error('Update repair status error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating repair status',
      error: err.message 
    });
  }
});

// @desc    Update full repair (Admin)
// @route   PATCH /api/repairs/:id
// @access  Private/Admin
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, technicianNotes, amount } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (technicianNotes) updateData.technicianNotes = technicianNotes;
    if (amount) updateData.amount = amount;
    updateData.updatedAt = new Date();

    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Repair updated successfully',
      data: repair
    });
  } catch (err) {
    console.error('Update repair error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating repair',
      error: err.message 
    });
  }
});

// @desc    Delete repair (Admin)
// @route   DELETE /api/repairs/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Repair deleted successfully'
    });
  } catch (err) {
    console.error('Delete repair error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting repair',
      error: err.message 
    });
  }
});

module.exports = router;