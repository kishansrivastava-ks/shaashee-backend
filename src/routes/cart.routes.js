// src/routes/cart.routes.js
const express = require("express");
const { protect } = require("../middleware/auth");
const cartController = require("../controllers/cart.controller");

const router = express.Router();

// all cart routes require logged-in user
router.use(protect);

router.get("/", cartController.getMyCart);
router.post("/add", cartController.addToCart);
router.post("/update", cartController.updateCartItem);
router.post("/remove", cartController.removeFromCart);
router.post("/clear", cartController.clearCart);

module.exports = router;
