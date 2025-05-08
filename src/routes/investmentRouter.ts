import { investmentController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.post('/create', investmentController.create);
router.get('/user', investmentController.findByUserId);
router.get('/find', investmentController.findById);

export { router as investementRouter };
