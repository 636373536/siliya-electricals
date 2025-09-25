const asyncHandler = require('express-async-handler');
const Repair = require('../models/Repair');

// Get all repairs
const getRepairs = asyncHandler(async (req, res) => {
  const repairs = await Repair.find({}).populate('user', 'name email phone');
  res.json(repairs);
});

// Create new repair
const createRepair = asyncHandler(async (req, res) => {
  const { deviceType, brand, model, issue } = req.body;

  const repair = new Repair({
    user: req.user._id,
    deviceType,
    brand,
    model,
    issue,
    photos: req.files ? req.files.map(file => file.filename) : [],
  });

  const createdRepair = await repair.save();
  res.status(201).json(createdRepair);
});

// Get repair by ID
const getRepairById = asyncHandler(async (req, res) => {
  const repair = await Repair.findById(req.params.id).populate('user', 'name email phone');

  if (repair) {
    res.json(repair);
  } else {
    res.status(404);
    throw new Error('Repair not found');
  }
});

// Update repair
const updateRepair = asyncHandler(async (req, res) => {
  const { status, technicianNotes, amount } = req.body;

  const repair = await Repair.findById(req.params.id);

  if (repair) {
    repair.status = status || repair.status;
    repair.technicianNotes = technicianNotes || repair.technicianNotes;
    repair.amount = amount || repair.amount;
    repair.updatedAt = Date.now();

    const updatedRepair = await repair.save();
    res.json(updatedRepair);
  } else {
    res.status(404);
    throw new Error('Repair not found');
  }
});

// Get repairs for a specific user
const getUserRepairs = asyncHandler(async (req, res) => {
  const repairs = await Repair.find({ user: req.user._id });
  res.json(repairs);
});

// @desc    Export repairs
// @route   GET /api/repairs/export
// @access  Private/Admin
const exportRepairs = asyncHandler(async (req, res) => {
  const repairs = await Repair.find({}).populate('user', 'name email phone');

  // Convert to CSV
  let csv = 'ID,Customer,Device,Brand,Model,Status,Amount,Date\n';
  repairs.forEach(repair => {
    csv += `${repair._id},${repair.user.name},${repair.deviceType},${repair.brand},${repair.model},${repair.status},${repair.amount || 0},${repair.createdAt}\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('repairs-export.csv');
  res.send(csv);
});

module.exports = {
  getRepairs,
  createRepair,
  getRepairById,
  updateRepair,
  getUserRepairs,
  exportRepairs,
};