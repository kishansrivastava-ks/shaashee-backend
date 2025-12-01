// src/models/product.model.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // if using Cloudinary/AWS
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: { type: String, required: true, index: true }, // e.g. 'ethnic'
    subCategory: { type: String, index: true }, // e.g. 'sarees'

    description: { type: String, required: true },

    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },

    sku: { type: String, required: true, unique: true, trim: true },

    images: {
      type: [imageSchema],
      default: [],
    },

    sizes: [{ type: String }], // ["Free Size", "S", "M", ...]
    fabric: { type: String },
    work: { type: String },
    length: { type: String },
    occasion: { type: String },
    pattern: { type: String },

    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    badges: [{ type: String }], // ["new", "bestseller", ...]
    tags: [{ type: String, index: true }], // ["silk", "banarasi", ...]

    isActive: { type: Boolean, default: true }, // soft-disable product
  },
  { timestamps: true }
);

// text index for search on name/description/tags
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

module.exports = mongoose.model("Product", productSchema);
