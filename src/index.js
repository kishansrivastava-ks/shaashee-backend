const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // connect to MongoDB (safe to start even if DB not present; will throw on invalid URI)
    await connectDB(process.env.MONGO_URI);
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });

    // graceful shutdown
    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down");
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
})();
