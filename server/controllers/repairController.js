const asyncHandler = require('express-async-handler');
const Repair = require('../models/Repair');
const User = require('../models/User');
const axios = require('axios');

// -----------------------------
// Resend Email Helper
// -----------------------------
const sendResendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY || !to) return;

  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: process.env.FROM_EMAIL,
        to: [to],
        subject,
        html,
      },
      {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      }
    );
  } catch (err) {
    console.error('Resend error:', err.response?.data || err.message);
  }
};

// -----------------------------
// GET ALL REPAIRS (Admin – or User gets own repairs)
// -----------------------------
const getRepairs = asyncHandler(async (req, res) => {
  let repairs;

  if (req.user.role === 'admin') {
    repairs = await Repair.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
  } else {
    repairs = await Repair.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
  }

  res.json(repairs);
});

// -----------------------------
// CREATE NEW REPAIR
// -----------------------------
const createRepair = asyncHandler(async (req, res) => {
  const { deviceType, brand, model, issue } = req.body;

  if (!deviceType || !issue) {
    res.status(400);
    throw new Error('Device type and issue are required');
  }

  const photos =
    req.files && req.files.length > 0
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

  const repair = new Repair({
    user: req.user._id,
    deviceType,
    brand,
    model,
    issue,
    photos,
  });

  const createdRepair = await repair.save();

  // Email the user (optional)
  const user = await User.findById(req.user._id);
  if (user) {
    sendResendEmail({
      to: user.email,
      subject: 'Repair Request Received',
      html: `<p>Hi ${user.name}, your repair request has been received.</p>
             <p>Device: <strong>${deviceType}</strong></p>
             <p>Status: <strong>${createdRepair.status}</strong></p>`,
    });
  }

  res.status(201).json(createdRepair);
});

// -----------------------------
// GET REPAIR BY ID
// -----------------------------
const getRepairById = asyncHandler(async (req, res) => {
  const repair = await Repair.findById(req.params.id).populate(
    'user',
    'name email phone'
  );

  if (!repair) {
    res.status(404);
    throw new Error('Repair not found');
  }

  // Non-admin cannot see others' repairs
  if (req.user.role !== 'admin' && repair.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(repair);
});

// -----------------------------
// UPDATE REPAIR (Admin Only)
// -----------------------------
const updateRepair = asyncHandler(async (req, res) => {
  const { status, technicianNotes, amount } = req.body;

  const repair = await Repair.findById(req.params.id);

  if (!repair) {
    res.status(404);
    throw new Error('Repair not found');
  }

  repair.status = status || repair.status;
  repair.technicianNotes = technicianNotes || repair.technicianNotes;
  repair.amount = amount || repair.amount;
  repair.updatedAt = Date.now();

  const updatedRepair = await repair.save();

  // Email notification to customer
  const user = await User.findById(repair.user);
  if (user && user.email) {
    sendResendEmail({
      to: user.email,
      subject: 'Repair Status Updated',
      html: `<p>Your repair status has been updated to: <strong>${updatedRepair.status}</strong></p>`,
    });
  }

  res.json(updatedRepair);
});

// -----------------------------
// GET USER'S OWN REPAIRS
// -----------------------------
const getUserRepairs = asyncHandler(async (req, res) => {
  const repairs = await Repair.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json(repairs);
});

// -----------------------------
// EXPORT REPAIRS TO CSV
// -----------------------------
const exportRepairs = asyncHandler(async (req, res) => {
  const repairs = await Repair.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  let csv = 'ID,Customer,Device,Brand,Model,Status,Amount,Date\n';

  repairs.forEach((r) => {
    csv += `${r._id},${r.user?.name || ''},${r.deviceType},${r.brand || ''},${
      r.model || ''
    },${r.status},${r.amount || 0},${r.createdAt}\n`;
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
