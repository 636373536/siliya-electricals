class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Utility function to create a 404 error
  const createNotFoundError = (resource) => {
    return new AppError(`${resource} not found`, 404);
  };
  
  module.exports = { AppError, createNotFoundError };