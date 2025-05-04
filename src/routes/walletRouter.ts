import { walletController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.get('/user', walletController.findByUserId);

export { router as walletRouter };
