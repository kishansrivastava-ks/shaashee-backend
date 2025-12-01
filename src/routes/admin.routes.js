// src/routes/admin.routes.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

// create a new admin (admin-only)
router.post(
  "/create",
  protect,
  authorize("admin"),
  adminController.createAdmin
);

module.exports = router;
