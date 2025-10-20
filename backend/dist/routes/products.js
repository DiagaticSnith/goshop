"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_1 = require("../controllers/products");
const multerMiddleware_1 = require("../middleware/multerMiddleware");
const processImageUpload_1 = require("../middleware/processImageUpload");
const authMiddleware_1 = require("../middleware/authMiddleware");
const verifyRolesMiddleware_1 = require("../middleware/verifyRolesMiddleware");
const router = (0, express_1.Router)();
router.get("/", products_1.getAllProducts);
router.get("/admin/all", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), products_1.getAllProductsAdmin);
router.post("/search", products_1.searchForProducts);
router.get("/category/:id", products_1.getProductsByCategory);
// inventory stats (admin only) MUST be before ":id" route
router.get("/stats/inventory", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), products_1.getInventoryStats);
router.get("/:id", products_1.getProductById);
// accept either `image` or legacy `avatar` file field from frontend
router.post("/", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), multerMiddleware_1.multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), processImageUpload_1.processImageUpload, products_1.createProduct);
router.patch("/:id", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), multerMiddleware_1.multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), processImageUpload_1.processImageUpload, products_1.updateProduct);
router.delete("/:id", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), products_1.deleteProduct);
router.patch("/:id/status", authMiddleware_1.authMiddleware, (0, verifyRolesMiddleware_1.verifyRolesMiddleware)(["ADMIN"]), products_1.setProductStatus);
exports.default = router;
