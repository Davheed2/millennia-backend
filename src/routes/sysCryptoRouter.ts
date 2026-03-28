import { sysCryptoController } from '@/controllers/sysCryptoController';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.get('/', sysCryptoController.getGlobalAddress);
router.use(protect);
router.post('/', sysCryptoController.updateGlobalAddress);

export { router as sysCryptoRouter };
