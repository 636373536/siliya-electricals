const express = require('express');
const {
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/auth');

const router = express.Router();

router.route('/conversations').get(protect, admin, getConversations);
router.route('/:userId').get(protect, getMessages);
router.route('/:userId/read').put(protect, admin, markAsRead);
router.route('/').post(protect, sendMessage);

module.exports = router;