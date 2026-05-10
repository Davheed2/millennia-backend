import { assetsController } from '@/controllers';
import express from 'express';

const router = express.Router();

router.get('/stocks', assetsController.getAllStocks);
router.get('/etfs', assetsController.getAllEtfs);
router.get('/type', assetsController.getAssetsByType);
router.get('/summary', assetsController.getMarketSummary);
router.get('/', assetsController.getAssetsByType);

export { router as assetsRouter };
