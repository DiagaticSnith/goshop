import { Router } from "express";
import { getAllOrders, getOrdersByUserId, getOrderById, getOrdersStats } from "../controllers/orders";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";
const router = Router();

router.use(authMiddleware);
router.get("/", verifyRolesMiddleware(["ADMIN"]), getAllOrders);
router.get("/user/:id", getOrdersByUserId);
router.get("/stats", verifyRolesMiddleware(["ADMIN"]), getOrdersStats);
router.get("/:id", getOrderById);

export default router;