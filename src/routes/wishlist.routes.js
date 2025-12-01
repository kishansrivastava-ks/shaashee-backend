// src/routes/wishlist.routes.js
const express = require("express");
const { protect } = require("../middleware/auth");
const wishlistController = require("../controllers/wishlist.controller");

const router = express.Router();

router.use(protect);

router.get("/", wishlistController.getMyWishlist);
router.post("/add", wishlistController.addToWishlist);
router.post("/remove", wishlistController.removeFromWishlist);

module.exports = router;
