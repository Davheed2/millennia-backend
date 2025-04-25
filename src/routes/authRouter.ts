import { authController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.post('/sign-up', authController.signUp);
router.get('/verify-account', authController.verifyAccount);
router.post('/sign-in', authController.signIn);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/health', authController.appHealth);

//protect all routes after this middleware
router.use(protect);
router.get('/sign-out', authController.signOut);
router.post('/password/change', authController.changePassword);

export { router as authRouter };
