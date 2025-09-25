const mongoose = require('mongoose');

const repairSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  deviceType: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'diagnosing', 'repairing', 'testing', 'completed', 'collected'],
    default: 'pending'
  },
  photos: [{
    type: String,
    validate: {
      validator: function(v) {
        return v.endsWith('.jpg') || v.endsWith('.png') || v.endsWith('.jpeg');
      },
      message: 'Photo must be a valid image URL'
    }
  }],
  technicianNotes: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Repair', repairSchema);