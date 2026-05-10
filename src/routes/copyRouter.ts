import { copyController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);

router.post('/subscribe', copyController.subscribe);
router.delete('/unsubscribe/:subscriptionId', copyController.unsubscribe);
router.get('/my-copies', copyController.getMySubscriptions);
router.get('/trader/followers', copyController.getTraderFollowers);
router.get('/user/positions', copyController.getUserPositions);

export { router as copyRouter };
