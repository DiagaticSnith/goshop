import { Router } from "express";
import { 
    getAllProducts, 
    getProductById, 
    getProductsByCategory, 
    searchForProducts, 
    deleteProduct, 
    createProduct, 
    updateProduct 
} from "../controllers/products";
import { multerUpload } from "../middleware/multerMiddleware";
import { processImageUpload } from "../middleware/processImageUpload";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";

const router = Router();
router.get("/", getAllProducts);
router.post("/search", searchForProducts);
router.get("/category/:id", getProductsByCategory);
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

export default router;
