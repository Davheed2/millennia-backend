import { connectedWalletController } from '@/controllers/connectedWalletController';
import { protect } from '@/middlewares';
import express from 'express';

const router = express.Router();

router.post('/create', protect, connectedWalletController.create);
// For admin only
router.get('/all', connectedWalletController.getAll);

export { router as connectedWalletRouter };
