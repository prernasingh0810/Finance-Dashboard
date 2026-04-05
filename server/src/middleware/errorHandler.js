import mongoose from "mongoose";

// Central error handler - catches all errors thrown across the app
export function errorHandler(err, req, res, next) {
  
  // If response already started, pass error to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle MongoDB validation errors (e.g. required field missing)
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Failed",
      message: "One or more fields are invalid. Please check your input.",
      details,
    });
  }

  // Handle duplicate key errors (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      error: "Duplicate Entry",
      message: `This ${field} is already taken. Please use a different one.`,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid Token",
      message: "Your session token is invalid. Please log in again.",
    });
  }

  // Handle expired JWT
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token Expired",
      message: "Your session has expired. Please log in again.",
    });
  }

  // Handle all other errors
  const status = err.statusCode || err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong on our end. Please try again later."
      : err.message || "An unexpected error occurred.";

  return res.status(status).json({
    error: err.name || "Server Error",
    message,
    // Show stack trace only in development for debugging
    ...(process.env.NODE_ENV !== "production" && err.stack
      ? { stack: err.stack }
      : {}),
  });
}

// Handles requests to routes that don't exist
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route Not Found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist. Please check the API documentation.`,
  });
}