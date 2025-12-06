// src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const sendEmail = require("../utils/email");

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

exports.signup = async (req, res, next) => {
  const { firstName, lastName, email, phone, password, confirmPassword } =
    req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  // create user with isVerified false
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
  });

  // create verification code and send email
  const code = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  const subject = "Verify your email for MyShop";
  const text = `Your verification code is: ${code}. It expires in 15 minutes.`;
  const html = `<p>Your verification code is:</p><h2>${code}</h2><p>It expires in 15 minutes.</p>`;

  console.log("Verification code (for testing):", code);
  await sendEmail({ to: user.email, subject, text, html });
  console.log("Verification email sent to:", user.email);

  res.status(201).json({
    message: "User created. Verification code sent to email.",
    email: user.email,
  });
};

exports.verifyEmail = async (req, res, next) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: "Email and code required" });

  const user = await User.findOne({ email }).select(
    "+verificationCodeHash +verificationCodeExpires isVerified"
  );
  if (!user) return res.status(400).json({ message: "Invalid email or code" });

  if (user.isVerified)
    return res.status(400).json({ message: "User already verified" });

  const ok = user.verifyVerificationCode(code);
  if (!ok)
    return res
      .status(400)
      .json({ message: "Invalid or expired verification code" });

  user.isVerified = true;
  user.verificationCodeHash = undefined;
  user.verificationCodeExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  res.json({ message: "Email verified", token });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  // include password for comparison
  const user = await User.findOne({ email }).select(
    "+password isVerified role"
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (!user.isVerified)
    return res
      .status(403)
      .json({ message: "Email not verified. Please verify first." });

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user);
  res.json({ token, role: user.role });
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "No user with that email" });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = "Password Reset for MyShop";
  const text = `Reset your password using this link: ${resetURL} (link expires in 1 hour)`;
  const html = `<p>Reset your password by visiting the link below. This link is valid for 1 hour.</p><a href="${resetURL}">${resetURL}</a>`;

  await sendEmail({ to: user.email, subject, text, html });

  res.json({ message: "Password reset link sent to email" });
};

exports.resetPassword = async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword)
    return res.status(400).json({ message: "Token and passwords required" });
  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const jwtToken = signToken(user);
  res.json({ message: "Password reset successful", token: jwtToken });
};

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "firstName lastName email phone role isVerified createdAt"
  );
  res.json({ user });
};
