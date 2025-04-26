import { kycController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import { multerUpload } from '@/common/config';
import express from 'express';

const router = express.Router();

router.use(protect);

router.post(
	'/create',
	multerUpload.fields([
		{ name: 'document', maxCount: 1 },
		{ name: 'selfie', maxCount: 1 },
	]),
	kycController.create
);
router.get('/find', kycController.findByUserId);
router.get('/all', kycController.findAll);
router.post('/update', kycController.update);

export { router as kycRouter };
