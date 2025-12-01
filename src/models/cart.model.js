// src/models/cart.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
