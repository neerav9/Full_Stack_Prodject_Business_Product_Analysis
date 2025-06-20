// middleware/error_handler.js

// This middleware function catches errors that are "next-ed" from other routes/middlewares
const errorHandler = (err, req, res, next) => {
    // Log the error for server-side debugging (important!)
    console.error(err.stack); // err.stack provides a full stack trace

    // Determine the status code
    // If the error has a 'statusCode' property, use it; otherwise, default to 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;

    // Determine the error message
    // In production, you might want to send a generic message for 500 errors to avoid leaking details.
    // For development, sending the error message is helpful.
    const message = err.message || 'An unexpected error occurred';

    // Send the error response to the client
    res.status(statusCode).json({
        success: false, // Indicate that the request failed
        error: {
            code: statusCode,
            message: message,
            // Optionally, include more details in development mode
            // details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

module.exports = errorHandler;