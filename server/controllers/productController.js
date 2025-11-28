const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed!', 400), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

exports.uploadProductImage = upload.single('image');

// Get all products with filtering and pagination
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const { category, featured, search, page = 1, limit = 12 } = req.query;
  
  let query = {};
  
  if (category) query.category = category;
  if (featured) query.featured = featured === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }
  
  const products = await Product.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }
  });
});

// Get a single product
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

// Create a product
exports.createProduct = catchAsync(async (req, res, next) => {
  const productData = {
    ...req.body,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock),
    featured: req.body.featured === 'true'
  };
  
  if (req.file) {
    productData.image = `/uploads/products/${req.file.filename}`;
  }
  
  const newProduct = await Product.create(productData);
  
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct
    }
  });
});

// Update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };
  
  if (req.body.price) updateData.price = parseFloat(req.body.price);
  if (req.body.stock) updateData.stock = parseInt(req.body.stock);
  if (req.body.featured !== undefined) updateData.featured = req.body.featured === 'true';
  
  if (req.file) {
    updateData.image = `/uploads/products/${req.file.filename}`;
  }
  
  const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

// Delete a product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});