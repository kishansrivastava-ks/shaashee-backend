require("express-async-errors"); // to handle rejected promises in routes
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { json, urlencoded } = express;

const statusRoutes = require("./routes/status.routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const productRoutes = require("./routes/product.routes");
const uploadRoutes = require("./routes/upload.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// basic security & parsing
app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// logging (morgan)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// routes
app.use("/api/v1/status", statusRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/orders", orderRoutes);

// fallback for unknown routes
app.use(notFound);

// centralized error handler
app.use(errorHandler);

module.exports = app;
