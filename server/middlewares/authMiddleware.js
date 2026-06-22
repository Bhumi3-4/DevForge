const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Protects routes by verifying the JWT token.
 * Attaches the authenticated user to req.user.
 * Usage: router.get('/route', protect, controllerFn)
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization: Bearer <token> header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    return next(error);
  }

  // Verify token — throws JsonWebTokenError or TokenExpiredError on failure
  // Both are caught and handled by errorHandler middleware
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch fresh user data — ensures deactivated users are rejected
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    const error = new Error('User belonging to this token no longer exists');
    error.statusCode = 401;
    return next(error);
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated');
    error.statusCode = 403;
    return next(error);
  }

  // Attach user to request object for downstream controllers
  req.user = user;
  next();
};

module.exports = { protect };