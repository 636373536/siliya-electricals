const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all notifications
exports.getAllNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: {
      notifications
    }
  });
});

// Get active notifications for users
exports.getActiveNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ 
    active: true,
    $or: [
      { target: 'all' },
      { target: 'users' }
    ]
  })
  .populate('createdBy', 'name')
  .sort({ createdAt: -1 })
  .limit(10);
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: {
      notifications
    }
  });
});

// Create a notification
exports.createNotification = catchAsync(async (req, res, next) => {
  const newNotification = await Notification.create({
    ...req.body,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      notification: newNotification
    }
  });
});

// Update a notification
exports.updateNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// Delete a notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  
  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});