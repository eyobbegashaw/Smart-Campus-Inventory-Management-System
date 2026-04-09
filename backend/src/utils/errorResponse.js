/**
 * Custom Error Response Class
 * Extends built-in Error class to include status code
 */
class ErrorResponse extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a bad request error (400)
   */
  static badRequest(message, errors = null) {
    return new ErrorResponse(message, 400, errors);
  }

  /**
   * Create unauthorized error (401)
   */
  static unauthorized(message = 'Unauthorized access') {
    return new ErrorResponse(message, 401);
  }

  /**
   * Create forbidden error (403)
   */
  static forbidden(message = 'Access forbidden') {
    return new ErrorResponse(message, 403);
  }

  /**
   * Create not found error (404)
   */
  static notFound(resource = 'Resource') {
    return new ErrorResponse(`${resource} not found`, 404);
  }

  /**
   * Create conflict error (409)
   */
  static conflict(message = 'Resource already exists') {
    return new ErrorResponse(message, 409);
  }

  /**
   * Create validation error (422)
   */
  static validation(errors) {
    return new ErrorResponse('Validation failed', 422, errors);
  }

  /**
   * Create internal server error (500)
   */
  static internal(message = 'Internal server error') {
    return new ErrorResponse(message, 500);
  }

  /**
   * Convert to JSON response object
   */
  toJSON() {
    return {
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.errors && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

/**
 * Async handler wrapper to avoid try-catch blocks
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Handle mongoose cast errors
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = ErrorResponse.badRequest(message);
  }

  // Handle mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = ErrorResponse.conflict(message);
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = ErrorResponse.validation(errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ErrorResponse.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ErrorResponse.unauthorized('Token expired');
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = ErrorResponse.badRequest('File too large. Maximum size is 5MB');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = ErrorResponse.badRequest('Too many files. Maximum is 5');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = ErrorResponse.badRequest('Unexpected file field');
  }

  // Send response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    ...(error.errors && { errors: error.errors })
  };

  res.status(statusCode).json(response);
};

module.exports = {
  ErrorResponse,
  asyncHandler,
  globalErrorHandler
};