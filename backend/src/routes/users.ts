import { Router } from "express";
import { updateUser, getUserByFirebaseId, listUsers, toggleUserStatus, updateUserRole } from "../controllers/users";
import { multerUpload } from "../middleware/multerMiddleware";
import { processImageUpload } from "../middleware/processImageUpload";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";

const router = Router();
// Admin list users (option includeHidden)
router.get("/", authMiddleware, verifyRolesMiddleware(["ADMIN"]), listUsers);
// Diagnostic middleware to log multipart headers before multer
const logMultipartHeaders = (req: any, res: any, next: any) => {
	try {
		const ct = req.headers && req.headers['content-type'];
		const cl = req.headers && req.headers['content-length'];
		if (ct && typeof ct === 'string' && ct.includes('multipart/form-data') && !ct.includes('boundary=')) {
			console.warn('[logMultipartHeaders] multipart/form-data without boundary header detected', { contentType: ct, contentLength: cl });
		} else {
			console.info('[logMultipartHeaders] content-type', ct, 'content-length', cl);
		}
	} catch (e) {}
	next();
};

router.patch("/update/:id", authMiddleware, logMultipartHeaders, multerUpload.single("avatar"), processImageUpload, updateUser);
router.get("/:id", authMiddleware, getUserByFirebaseId);
// Admin toggle status ACTIVE/HIDDEN
router.post("/:id/toggle-status", authMiddleware, verifyRolesMiddleware(["ADMIN"]), toggleUserStatus);
// Admin update role
router.post("/:id/role", authMiddleware, verifyRolesMiddleware(["ADMIN"]), updateUserRole);
export default router;
