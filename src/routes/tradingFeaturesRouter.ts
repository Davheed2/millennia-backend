import { Router } from 'express';
import { protect } from '@/middlewares';
import { tradingFeaturesController } from '@/controllers';

const router = Router();

router.use(protect);

router.post('/bot/purchase', tradingFeaturesController.purchaseBot);
router.get('/user/bots', tradingFeaturesController.getUserBots);
router.post('/live/execute', tradingFeaturesController.executeLiveTrade);
router.get('/live/stats', tradingFeaturesController.getLiveTradeStats);

export { router as tradingFeaturesRouter };
