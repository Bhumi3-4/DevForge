const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  //  Mongoose: Bad ObjectId 
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  //  Mongoose: Duplicate Key 
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists`;
  }

  //  Mongoose: Validation Error 
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  //  JWT: Invalid Token 
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again';
  }
  //  JWT: Expired Token 
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again';
  }

  //  Log stack trace in development only 
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Expose stack trace in dev for easier debugging
    ...process.env.NODE_ENV === 'development' && { stack: err.stack },
  });
};

module.exports = errorHandler;