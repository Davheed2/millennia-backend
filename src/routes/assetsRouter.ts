import { assetsController } from '@/controllers';
import express from 'express';

const router = express.Router();

router.get('/stocks', assetsController.getAllStocks);
router.get('/etfs', assetsController.getAllEtfs);

export { router as assetsRouter };
