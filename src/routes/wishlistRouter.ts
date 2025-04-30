import { wishlistController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.post('/create', wishlistController.create);
router.get('/user', wishlistController.findAll);
router.post('/delete', wishlistController.delete);

export { router as wishlistRouter };