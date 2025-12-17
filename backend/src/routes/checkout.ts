import { Router } from "express";
import { createCheckoutSession, getCheckoutItems, getCheckoutSession } from "../controllers/checkout";
import { authMiddleware } from "../middleware/authMiddleware";
const router = Router();

router.use(authMiddleware);
// Legacy endpoints kept for backward compatibility with integration tests
// POST /checkout -> create session
router.post("/", createCheckoutSession);
// GET /checkout/:id -> retrieve session
router.get("/:id", getCheckoutSession);
// GET /checkout/:id/items -> list items
router.get("/:id/items", getCheckoutItems);
router.post("/create-session", createCheckoutSession);
router.get("/session/items/:id", getCheckoutItems);
router.get("/session/:id", getCheckoutSession);

export default router;