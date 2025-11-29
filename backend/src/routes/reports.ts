import { Router } from "express";
import { getOrdersReport, exportOrdersReport } from "../controllers/reports";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/orders", verifyRolesMiddleware(["ADMIN"]), getOrdersReport);
router.post("/orders/export", verifyRolesMiddleware(["ADMIN"]), exportOrdersReport);

export default router;
