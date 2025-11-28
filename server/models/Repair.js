const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  deviceType: { 
    type: String, 
    required: [true, 'Please provide device type'],
    trim: true 
  },
  brand: { 
    type: String, 
    trim: true 
  },
  model: { 
    type: String, 
    trim: true 
  },
  issue: { 
    type: String, 
    required: [true, 'Please describe the issue'],
    trim: true 
  },
  photos: [{ 
    type: String 
  }],
  customer: { 
    type: String,
    trim: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  technicianNotes: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now
  }
});

module.exports = mongoose.model('Repair', repairSchema);