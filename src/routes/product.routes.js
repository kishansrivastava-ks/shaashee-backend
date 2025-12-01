// src/routes/product.routes.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const productController = require("../controllers/product.controller");

const router = express.Router();

// PUBLIC routes
router.get("/", productController.getProducts); // list all (with filters)
router.get("/:id", productController.getProductById); // get one by id
router.get("/slug/:slug", productController.getProductBySlug); // get one by slug

// ADMIN routes
router.post("/", protect, authorize("admin"), productController.createProduct);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  productController.updateProduct
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  productController.deleteProduct
);

module.exports = router;
