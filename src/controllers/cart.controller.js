// src/controllers/cart.controller.js
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

// helper: get or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// GET /api/v1/cart - get my cart
exports.getMyCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images slug sku inStock stockQuantity",
  });

  if (!cart || cart.items.length === 0) {
    return res.json({ items: [], totalItems: 0, totalAmount: 0 });
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    const price = item.product ? item.product.price : 0;
    return sum + price * item.quantity;
  }, 0);

  res.json({
    items: cart.items,
    totalItems: cart.items.length,
    totalAmount,
  });
};

// POST /api/v1/cart/add
// body: { productId, quantity }
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId)
    return res.status(400).json({ message: "productId is required" });

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found or inactive" });
  }

  const qty = Number(quantity) || 1;
  if (qty < 1)
    return res.status(400).json({ message: "Quantity must be at least 1" });

  if (!product.inStock || product.stockQuantity < qty) {
    return res.status(400).json({ message: "Not enough stock" });
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );
  if (existingItem) {
    const newQty = existingItem.quantity + qty;
    if (product.stockQuantity < newQty) {
      return res.status(400).json({ message: "Exceeds available stock" });
    }
    existingItem.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }

  await cart.save();
  res.status(200).json({ message: "Added to cart", cart });
};

// POST /api/v1/cart/update
// body: { productId, quantity }
exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity === undefined) {
    return res
      .status(400)
      .json({ message: "productId and quantity are required" });
  }

  const qty = Number(quantity);
  if (qty < 0)
    return res.status(400).json({ message: "Quantity cannot be negative" });

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: "Item not in cart" });

  if (qty === 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }
    if (!product.inStock || product.stockQuantity < qty) {
      return res.status(400).json({ message: "Not enough stock" });
    }
    item.quantity = qty;
  }

  await cart.save();
  res.json({ message: "Cart updated", cart });
};

// POST /api/v1/cart/remove
// body: { productId }
exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;
  if (!productId)
    return res.status(400).json({ message: "productId is required" });

  const cart = await getOrCreateCart(req.user._id);
  const before = cart.items.length;

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();

  if (before === cart.items.length) {
    return res.status(404).json({ message: "Item not in cart" });
  }

  res.json({ message: "Item removed from cart", cart });
};

// POST /api/v1/cart/clear
exports.clearCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ message: "Cart cleared", cart });
};
