const express = require ("express");
const { protectAdmin } = require("../middleware/authMiddleware");

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
}= require("../controllers/orderController");

const router = express.Router();

router.post("/",createOrder);
router.get("/",protectAdmin, getOrders);
router.get("/:id",protectAdmin, getOrderById);
router.patch("/:id/status",protectAdmin, updateOrderStatus);
router.delete("/:id", protectAdmin, deleteOrder);

module.exports = router;