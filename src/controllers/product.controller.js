// src/controllers/product.controller.js
const Product = require("../models/product.model");

// Helper: build filter from query params
const buildProductFilter = (query) => {
  const filter = { isActive: true }; // only active by default

  if (query.category) filter.category = query.category;
  if (query.subCategory) filter.subCategory = query.subCategory;
  if (query.inStock !== undefined) {
    filter.inStock = query.inStock === "true";
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.tags) {
    const tags = query.tags.split(",").map((t) => t.trim());
    filter.tags = { $in: tags };
  }
  if (query.badges) {
    const badges = query.badges.split(",").map((b) => b.trim());
    filter.badges = { $in: badges };
  }

  // text search (name/description/tags)
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

exports.createProduct = async (req, res) => {
  const {
    name,
    slug,
    category,
    subCategory,
    description,
    price,
    currency,
    inStock,
    stockQuantity,
    sku,
    images,
    sizes,
    fabric,
    work,
    length,
    occasion,
    pattern,
    badges,
    tags,
  } = req.body;

  if (!name || !slug || !category || !description || !price || !sku) {
    return res.status(400).json({
      message: "name, slug, category, description, price, sku are required",
    });
  }

  // ensure slug and sku are unique
  const existingSku = await Product.findOne({ sku });
  if (existingSku)
    return res.status(400).json({ message: "SKU already exists" });

  const existingSlug = await Product.findOne({ slug });
  if (existingSlug)
    return res.status(400).json({ message: "Slug already exists" });

  const product = await Product.create({
    name,
    slug,
    category,
    subCategory,
    description,
    price,
    currency: currency || "INR",
    inStock: inStock !== undefined ? inStock : true,
    stockQuantity: stockQuantity || 0,
    sku,
    images: images || [],
    sizes: sizes || [],
    fabric,
    work,
    length,
    occasion,
    pattern,
    badges: badges || [],
    tags: tags || [],
  });

  res.status(201).json({ message: "Product created", product });
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // protect slug/sku uniqueness
  if (updateData.sku) {
    const existingSku = await Product.findOne({
      sku: updateData.sku,
      _id: { $ne: id },
    });
    if (existingSku)
      return res.status(400).json({ message: "SKU already exists" });
  }
  if (updateData.slug) {
    const existingSlug = await Product.findOne({
      slug: updateData.slug,
      _id: { $ne: id },
    });
    if (existingSlug)
      return res.status(400).json({ message: "Slug already exists" });
  }

  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json({ message: "Product updated", product });
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  // hard delete:
  // const product = await Product.findByIdAndDelete(id);

  // soft delete (recommended so orders referencing it don't break):
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false, inStock: false },
    { new: true }
  );

  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json({ message: "Product deleted (soft)", product });
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, isActive: true });
  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json({ product });
};

exports.getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug: slug, isActive: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
};

exports.getProducts = async (req, res) => {
  const filter = buildProductFilter(req.query);

  // pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // sorting
  // e.g. sort=price or sort=-price or sort=price,-createdAt
  let sort = "-createdAt";
  if (req.query.sort) {
    sort = req.query.sort.split(",").join(" ");
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
};
