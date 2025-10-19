import { Router } from "express";
import { updateUser, getUserByFirebaseId, listUsers, toggleUserStatus, updateUserRole } from "../controllers/users";
import { multerUpload } from "../middleware/multerMiddleware";
import { processImageUpload } from "../middleware/processImageUpload";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";

const router = Router();
// Admin list users (option includeHidden)
router.get("/", authMiddleware, verifyRolesMiddleware(["ADMIN"]), listUsers);
router.patch("/update/:id", authMiddleware, multerUpload.single("avatar"), processImageUpload, updateUser);
router.get("/:id", authMiddleware, getUserByFirebaseId);
// Admin toggle status ACTIVE/HIDDEN
router.post("/:id/toggle-status", authMiddleware, verifyRolesMiddleware(["ADMIN"]), toggleUserStatus);
// Admin update role
router.post("/:id/role", authMiddleware, verifyRolesMiddleware(["ADMIN"]), updateUserRole);
export default router;
