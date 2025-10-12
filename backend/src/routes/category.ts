import { Router } from "express";
import { getSingleCategory, getAllCategories, createCategory, updateCategory, deleteCategory } from "../controllers/category";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";
const router = Router();

router.get("/", getAllCategories);
router.get("/:id", getSingleCategory);
router.post("/", authMiddleware, verifyRolesMiddleware(["ADMIN"]), createCategory);
router.patch("/:id", authMiddleware, verifyRolesMiddleware(["ADMIN"]), updateCategory);
router.delete("/:id", authMiddleware, verifyRolesMiddleware(["ADMIN"]), deleteCategory);

export default router;
