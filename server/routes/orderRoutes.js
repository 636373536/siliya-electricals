const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    orderController.getAllOrders
  )
  .post(orderController.createOrder);

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    orderController.getOrder
  );

router
  .route('/:id/status')
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    orderController.updateOrderStatus
  );

router
  .route('/payment/callback')
  .post(orderController.paymentCallback);

module.exports = router;