// src/models/order.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true }, // price at time of order
    quantity: { type: Number, required: true },
    image: { type: String }, // primary image URL
    subtotal: { type: Number, required: true }, // price * quantity
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [orderItemSchema], required: true },

    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    shippingAddress: { type: addressSchema, required: true },

    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
