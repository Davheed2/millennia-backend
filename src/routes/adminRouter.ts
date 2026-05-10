import { Router } from 'express';
import { adminController } from '@/controllers/adminController';
import { protect, restrictTo } from '@/middlewares';
import { Role } from '@/common/constants';

const router = Router();

// All routes here are protected and restricted to Admin only
router.use(protect);
router.use(restrictTo(Role.Admin));

// Trader Management
router.get('/traders', adminController.getAllTraders);
router.post('/traders/status', adminController.updateTraderStatus);
router.patch('/traders/details', adminController.updateTraderDetails);

// Asset Management
router.get('/assets', adminController.getAllAssets);
router.post('/assets', adminController.createAsset);
router.delete('/assets/:assetId', adminController.deleteAsset);

// Performance
router.get('/performance', adminController.getPlatformPerformance);

// Payouts
router.get('/payouts/logs', adminController.getPayoutLogs);
router.post('/payouts/trigger', adminController.triggerManualPayout);

// Broadcast
router.post('/broadcast', adminController.broadcastAnnouncement);

export { router as adminRouter };
