const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in weeks']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  image: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
