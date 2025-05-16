import { userController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import { multerUpload } from '@/common/config';
import express from 'express';

const router = express.Router();

router.get('/company', userController.getCompanyPhone);

router.use(protect);

router.get('/', userController.getProfile);
router.get('/all', userController.getAllUsers);
router.post('/update-user', userController.updateProfile);
router.post('/upload-profile-picture', multerUpload.single('photo'), userController.uploadProfilePicture);
router.post('/suspend-user', userController.suspendUser);
router.post('/make-admin', userController.makeAdmin);
router.get('/delete-account', userController.deleteAccount);

router.post('/company-phone', userController.updateCompanyPhone);
router.get('/statistics', userController.findStats);

export { router as userRouter };
