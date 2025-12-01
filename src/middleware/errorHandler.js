const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    // In production, do not expose stack
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
