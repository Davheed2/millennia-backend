import { traderController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

// Public routes (Discovery)
router.get('/', traderController.getAllTraders);

// Protected routes (must come before /:id)
router.use(protect);
router.get('/me', traderController.getOwnTraderProfile);

// Public route (must come after /me)
router.get('/:id', traderController.getTraderProfile);
router.post('/register', traderController.registerAsTrader);
router.put('/profile', traderController.updateProfile);

export { router as traderRouter };
