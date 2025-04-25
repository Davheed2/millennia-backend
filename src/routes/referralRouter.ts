import { referralController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);

router.get('/all', referralController.findByReferrerId);

export { router as referralRouter };
