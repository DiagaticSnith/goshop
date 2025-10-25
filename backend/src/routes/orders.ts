import { Router } from "express";
import { getAllOrders, getOrdersByUserId, getOrderById, getOrdersStats, confirmOrder, rejectOrder } from "../controllers/orders";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";
const router = Router();

router.use(authMiddleware);
router.get("/", verifyRolesMiddleware(["ADMIN"]), getAllOrders);
router.get("/user/:id", getOrdersByUserId);
router.get("/stats", verifyRolesMiddleware(["ADMIN"]), getOrdersStats);
router.get("/:id", getOrderById);
router.post("/:id/confirm", verifyRolesMiddleware(["ADMIN"]), confirmOrder);
router.post("/:id/reject", verifyRolesMiddleware(["ADMIN"]), rejectOrder);

export default router;