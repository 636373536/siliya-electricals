const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRepairs,
  createRepair,
  getRepairById,
  updateRepair,
  getUserRepairs
} = require('../controllers/repairController');

router.get('/user', protect, getUserRepairs);

router
  .route('/')
  .get(protect, getRepairs)
  .post(protect, createRepair);

router
  .route('/:id')
  .get(protect, getRepairById)
  .put(protect, updateRepair);

module.exports = router;