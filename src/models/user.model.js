// src/models/user.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Email verification
    isVerified: { type: Boolean, default: false },
    verificationCodeHash: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },

    // Password reset
    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate and set email verification code (6-digit) and expiry (e.g., 15m)
userSchema.methods.createVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  this.verificationCodeHash = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return code;
};

// Verify provided code against stored hash
userSchema.methods.verifyVerificationCode = function (code) {
  console.log("Stored hash:", this.verificationCodeHash);
  console.log("Stored expiry:", this.verificationCodeExpires);
  if (!this.verificationCodeHash || !this.verificationCodeExpires) return false;
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return (
    hash === this.verificationCodeHash &&
    Date.now() < this.verificationCodeExpires
  );
};

// Create password reset token, store hashed and expiry (e.g., 1 hour)
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

module.exports = mongoose.model("User", userSchema);
