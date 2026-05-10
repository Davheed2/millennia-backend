import { tradeController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

// Public routes
router.get('/leaderboard', tradeController.getLeaderboard);
router.get('/trader/:traderId', tradeController.getTraderTrades);

// Protected routes (Trader Only)
router.use(protect);
router.post('/open', tradeController.openTrade);
router.put('/:id/close', tradeController.closeTrade);

export { router as tradeRouter };
