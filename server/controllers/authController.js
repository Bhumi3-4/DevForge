const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

//  @desc    Register a new user
//  @route   POST /api/auth/register
//  @access  Public 
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Manual validation — keeps error messages consistent and controlled
  if (!name || !email || !password) {
    const error = new Error('Please provide name, email and password');
    error.statusCode = 400;
    return next(error);
  }

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    return next(error);
  }

  // Check for duplicate email — errorHandler also catches code 11000
  // but explicit check gives a cleaner early response
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    return next(error);
  }

   // Create user — password hashing handled by pre-save hook in model
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token: generateToken(user._id),
    user: user.toPublicProfile(),
  });
};

//  @desc    Login user
//  @route   POST /api/auth/login
//  @access  Public 
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    return next(error);
  }

  // Explicitly select password since select: false is set on the schema
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

   if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    return next(error);
  }

  // Check account status before password comparison
  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact support');
    error.statusCode = 403;
    return next(error);
  }

  // Use model instance method to compare passwords
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Same error message as wrong email — prevents user enumeration attack
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token: generateToken(user._id),
    user: user.toPublicProfile(),
  });
};

//  @desc    Get currently logged in user
//  @route   GET /api/auth/me
//  @access  Private 
const getMe = async (req, res) => {
  // req.user is already attached by protect middleware
  res.status(200).json({
    success: true,
    user: req.user.toPublicProfile(),
  });
};

module.exports = { registerUser, loginUser, getMe };