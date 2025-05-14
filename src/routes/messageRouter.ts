import { messageController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.get('/user', messageController.getMessagesByUser);
router.get('/admin-user', messageController.getMessagesByAdmin);
router.get('/all-last-messages', messageController.getAllUsersWithLastMessages);

export { router as messageRouter };
