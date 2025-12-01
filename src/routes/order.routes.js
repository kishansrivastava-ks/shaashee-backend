// src/routes/order.routes.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const orderController = require("../controllers/order.controller");

const router = express.Router();

// USER routes
router.use(protect);

router.post("/from-cart", orderController.createOrderFromCart);
router.get("/my", orderController.getMyOrders);
router.get("/my/:id", orderController.getMyOrderById);
router.post("/my/:id/cancel", orderController.cancelMyOrder);

// ADMIN routes
router.get("/", authorize("admin"), orderController.adminGetOrders);
router.get("/:id", authorize("admin"), orderController.adminGetOrderById);
router.patch(
  "/:id/status",
  authorize("admin"),
  orderController.adminUpdateOrderStatus
);

module.exports = router;
