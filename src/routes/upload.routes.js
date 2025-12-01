// src/routes/upload.routes.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const uploadController = require("../controllers/upload.controller");

const router = express.Router();

/**
 * Upload product images
 * Method: POST
 * URL: /api/v1/uploads/product-images
 * Body: form-data with key "images" (can be multiple)
 */
router.post(
  "/product-images",
  protect,
  authorize("admin"),
  upload.array("images", 5), // max 5 images per request (adjust as needed)
  uploadController.uploadProductImages
);

module.exports = router;
