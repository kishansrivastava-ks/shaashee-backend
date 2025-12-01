// src/controllers/wishlist.controller.js
const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// GET /api/v1/wishlist
exports.getMyWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    select: "name price images slug sku inStock isActive",
  });

  if (!wishlist) {
    return res.json({ products: [] });
  }

  res.json({ products: wishlist.products });
};

// POST /api/v1/wishlist/add
// body: { productId }
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId)
    return res.status(400).json({ message: "productId is required" });

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found or inactive" });
  }

  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.products.some((id) => id.toString() === productId);
  if (!exists) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  res.status(200).json({ message: "Added to wishlist", wishlist });
};

// POST /api/v1/wishlist/remove
// body: { productId }
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId)
    return res.status(400).json({ message: "productId is required" });

  const wishlist = await getOrCreateWishlist(req.user._id);
  const before = wishlist.products.length;

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );
  await wishlist.save();

  if (before === wishlist.products.length) {
    return res.status(404).json({ message: "Product not in wishlist" });
  }

  res.json({ message: "Removed from wishlist", wishlist });
};
