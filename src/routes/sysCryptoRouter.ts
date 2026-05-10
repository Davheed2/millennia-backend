import { sysCryptoController } from '@/controllers/sysCryptoController';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.get('/', sysCryptoController.getGlobalAddress);
router.use(protect);
router.post('/', sysCryptoController.updateGlobalAddress);
router.post('/add', sysCryptoController.addCrypto);
router.put('/:id', sysCryptoController.updateCrypto);
router.delete('/:id', sysCryptoController.deleteCrypto);

export { router as sysCryptoRouter };
