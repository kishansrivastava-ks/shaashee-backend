// src/controllers/admin.controller.js
const User = require("../models/user.model");

exports.createAdmin = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already in use" });

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "admin",
    isVerified: true, // admin created by another admin is auto-verified
  });

  res.status(201).json({
    message: "Admin created successfully",
    admin: {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    },
  });
};
