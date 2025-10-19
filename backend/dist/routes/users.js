"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = require("../controllers/users");
const multerMiddleware_1 = require("../middleware/multerMiddleware");
const processImageUpload_1 = require("../middleware/processImageUpload");
const authMiddleware_1 = require("../middleware/authMiddleware");
const verifyRolesMiddleware_1 = require("../middleware/verifyRolesMiddleware");
const router = (0, express_1.Router)();
// Admin list users (option includeHidden)
router.get("/", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), users_1.listUsers);
router.patch("/update/:id", authMiddleware_1.authMiddleware, multerMiddleware_1.multerUpload.single("avatar"), processImageUpload_1.processImageUpload, users_1.updateUser);
router.get("/:id", authMiddleware_1.authMiddleware, users_1.getUserByFirebaseId);
// Admin toggle status ACTIVE/HIDDEN
router.post("/:id/toggle-status", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), users_1.toggleUserStatus);
// Admin update role
router.post("/:id/role", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), users_1.updateUserRole);
exports.default = router;
