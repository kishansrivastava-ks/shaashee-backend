const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async (mongoUri) => {
  if (!mongoUri) throw new Error("MONGO_URI not provided");
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection error", err);
    throw err;
  }
};

module.exports = connectDB;
