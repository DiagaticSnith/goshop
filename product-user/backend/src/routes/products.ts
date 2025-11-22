import { Router } from "express";
import { 
    getAllProducts, 
    getAllProductsAdmin,
    getProductById, 
    getProductsByCategory, 
    searchForProducts, 
    deleteProduct, 
    createProduct, 
    updateProduct, 
    getInventoryStats, 
    setProductStatus 
} from "../controllers/products";
import { multerUpload } from "../middleware/multerMiddleware";
import { processImageUpload } from "../middleware/processImageUpload";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";

const router = Router();
router.get("/", getAllProducts);
router.get("/admin/all", authMiddleware, verifyRolesMiddleware(["ADMIN"]), getAllProductsAdmin);
router.post("/search", searchForProducts);
router.get("/category/:id", getProductsByCategory);
// inventory stats (admin only) MUST be before ":id" route
router.get("/stats/inventory", authMiddleware, verifyRolesMiddleware(["ADMIN"]), getInventoryStats);
router.get("/:id", getProductById);
// accept either `image` or legacy `avatar` file field from frontend
router.post(
    "/",
    authMiddleware,
    verifyRolesMiddleware(["ADMIN"]),
    multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
    processImageUpload,
    createProduct
);
router.patch(
    "/:id",
    authMiddleware,
    verifyRolesMiddleware(["ADMIN"]),
    multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
    processImageUpload,
    updateProduct
);
router.delete("/:id", authMiddleware, verifyRolesMiddleware(["ADMIN"]), deleteProduct);
router.patch(
    "/:id/status",
    authMiddleware,
    verifyRolesMiddleware(["ADMIN"]),
    setProductStatus
);

export default router;
