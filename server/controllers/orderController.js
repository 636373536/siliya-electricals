const Order = require('../models/Order');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new order
exports.createOrder = catchAsync(async (req, res, next) => {
  const { customer, items, paymentMethod, transactionId } = req.body;
  
  // Calculate total and validate items
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new AppError(`Product with ID ${item.product} not found`, 404));
    }
    
    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, 400));
    }
    
    total += product.price * item.quantity;
    item.price = product.price;
    
    // Reduce product stock
    product.stock -= item.quantity;
    await product.save({ validateBeforeSave: false });
  }
  
  const order = await Order.create({
    customer,
    items,
    total,
    paymentMethod,
    transactionId
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Get all orders
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate('items.product');
  
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders
    }
  });
});

// Get a single order
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Update order status
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Process payment callback
exports.paymentCallback = catchAsync(async (req, res, next) => {
  const { orderId, status, transactionId } = req.body;
  
  const order = await Order.findByIdAndUpdate(
    orderId,
    { 
      paymentStatus: status,
      transactionId: transactionId || undefined
    },
    { new: true, runValidators: true }
  );
  
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});