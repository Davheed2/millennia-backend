import { multerUpload } from '@/common/config';
import { transactionController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.use(protect);
router.get('/user', transactionController.findByUserId);
router.post('/deposit', multerUpload.single('paymentProof'), transactionController.walletTopUp);
router.post('/withdraw', transactionController.withdrawFunds);
router.post('/update', transactionController.updateTransaction);
router.post('/update/deposit', transactionController.updateDeposit);
router.post('/update/withdrawal', transactionController.updateWithdrawal);
router.get('/deposits', transactionController.fetchDeposits);
router.get('/withdrawals', transactionController.fetchWithdrawals);

export { router as transactionRouter };
