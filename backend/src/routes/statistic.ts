import {Router} from 'express';
import {
    getStatisticSummary,
    getSaleOverTime,
    getTopProducts,
} from '../controllers/statistic'
import { multerUpload } from "../middleware/multerMiddleware";
import { processImageUpload } from "../middleware/processImageUpload";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifyRolesMiddleware } from "../middleware/verifyRolesMiddleware";
import { defaultMaxListeners } from 'events';

const router = Router();

router.use(authMiddleware, verifyRolesMiddleware(['ADMIN']));

router.get('/summary', getStatisticSummary);
router.get('/sales-over-time', getSaleOverTime);
router.get('/top-products', getTopProducts);

export default router;