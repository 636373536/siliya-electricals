const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get conversations
// @route   GET /api/messages/conversations
// @access  Private/Admin
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Message.aggregate([
    {
      $group: {
        _id: '$userId',
        lastMessage: { $last: '$content' },
        lastMessageDate: { $max: '$timestamp' },
        unreadCount: {
          $sum: {
            $cond: [{ $eq: ['$read', false] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        lastMessage: 1,
        lastMessageDate: 1,
        unreadCount: 1
      }
    },
    {
      $sort: { lastMessageDate: -1 }
    }
  ]);

  res.json(conversations);
});

// @desc    Get messages for a user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ userId: req.params.userId })
    .sort({ timestamp: 1 });

  res.json(messages);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/read
// @access  Private/Admin
const markAsRead = asyncHandler(async (req, res) => {
  await Message.updateMany(
    { userId: req.params.userId, sender: 'user', read: false },
    { $set: { read: true } }
  );

  res.json({ success: true });
});

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { userId, content } = req.body;

  const message = new Message({
    sender: req.user.role === 'admin' ? 'admin' : 'user',
    userId,
    content
  });

  const createdMessage = await message.save();
  res.status(201).json(createdMessage);
});

module.exports = {
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
};