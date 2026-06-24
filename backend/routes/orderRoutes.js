const express = require ("express");
const { protectAdmin } = require("../middleware/authMiddleware");

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
}= require("../controllers/orderController");

const router = express.Router();

router.post("/",createOrder);
router.get("/",protectAdmin, getOrders);
router.get("/:id",protectAdmin, getOrderById);
router.patch("/:id/status",protectAdmin, updateOrderStatus);

module.exports = router;