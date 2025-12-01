// src/controllers/order.controller.js
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

// USER: POST /api/v1/orders/from-cart
// body: { shippingAddress, paymentMethod?, notes? }
exports.createOrderFromCart = async (req, res) => {
  const { shippingAddress, paymentMethod = "COD", notes } = req.body;

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.addressLine1 ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.postalCode
  ) {
    return res.status(400).json({ message: "Incomplete shipping address" });
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images sku inStock stockQuantity isActive",
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // prepare order items, check stock
  const orderItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return res
        .status(400)
        .json({ message: "Some products are no longer available" });
    }

    if (!product.inStock || product.stockQuantity < item.quantity) {
      return res.status(400).json({
        message: `Not enough stock for product: ${product.name}`,
      });
    }

    const primaryImage = product.images?.length
      ? product.images[0].url || product.images[0]
      : undefined;
    const price = product.price;
    const qty = item.quantity;
    const subtotal = price * qty;

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price,
      quantity: qty,
      image: primaryImage,
      subtotal,
    });

    totalAmount += subtotal;
  }

  // reduce stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    product.stockQuantity -= item.quantity;
    if (product.stockQuantity <= 0) {
      product.stockQuantity = 0;
      product.inStock = false;
    }
    await product.save({ validateBeforeSave: false });
  }

  // create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount,
    currency: "INR",
    status: "pending",
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "pending" : "pending", // adjust later with real payments
    shippingAddress,
    notes,
  });

  // clear cart
  cart.items = [];
  await cart.save();

  res.status(201).json({
    message: "Order created",
    order,
  });
};

// USER: GET /api/v1/orders/my
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json({ count: orders.length, orders });
};

// USER: GET /api/v1/orders/my/:id
exports.getMyOrderById = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({ _id: id, user: req.user._id }).populate({
    path: "items.product",
    select: "name slug images",
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({ order });
};

// USER: POST /api/v1/orders/my/:id/cancel
exports.cancelMyOrder = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!["pending", "confirmed"].includes(order.status)) {
    return res
      .status(400)
      .json({ message: "Order cannot be cancelled at this stage" });
  }

  order.status = "cancelled";
  await order.save();

  // optional: restock items
  // for (const item of order.items) { ... }

  res.json({ message: "Order cancelled", order });
};

// ADMIN: GET /api/v1/orders (with filters)
exports.adminGetOrders = async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (userId) filter.user = userId;

  const orders = await Order.find(filter)
    .populate({ path: "user", select: "firstName lastName email" })
    .sort("-createdAt");

  res.json({ count: orders.length, orders });
};

// ADMIN: GET /api/v1/orders/:id
exports.adminGetOrderById = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate({ path: "user", select: "firstName lastName email" })
    .populate({ path: "items.product", select: "name slug images" });

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({ order });
};

// ADMIN: PATCH /api/v1/orders/:id/status
// body: { status }
exports.adminUpdateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  await order.save();

  res.json({ message: "Order status updated", order });
};
