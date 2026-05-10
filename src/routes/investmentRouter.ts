import { investmentController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.post('/confirm', investmentController.confirm);
router.post('/create', investmentController.create);
router.get('/user', investmentController.findByUserId);
router.get('/find', investmentController.findById);
router.post('/withdraw', investmentController.withdrawProfit);
router.post('/close', investmentController.closePosition);

export { router as investementRouter };
