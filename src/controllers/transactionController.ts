import { Request, Response } from 'express';
import {
	AppError,
	AppResponse,
	referenceGenerator,
	sendProcessingDepositEmail,
	sendProcessingWithdrawalEmail,
	toJSON,
	uploadDocumentFile,
} from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { transactionRepository, walletRepository } from '@/repository';

export class TransactionController {
	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const transaction = await transactionRepository.findByUserId(user.id);
		if (!transaction) throw new AppError('No transaction found', 404);

		return AppResponse(res, 200, toJSON(transaction), 'User Transacions retrieved successfully');
	});

	walletTopUp = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { amount, crypto, address } = req.body;
		const { file } = req;

		if (!user) throw new AppError('Please log in again', 400);
		if (!amount) throw new AppError('Amount is required', 400);
		if (!crypto) throw new AppError('Crypto is required', 400);
		if (!address) throw new AppError('Crypto Address is required', 400);

		let paymentProof: string | null = null;
		if (file?.buffer && file?.originalname && file?.mimetype) {
			const { secureUrl } = await uploadDocumentFile({
				fileName: `payment-proof/${Date.now()}-${file.originalname}`,
				buffer: file.buffer,
				mimetype: file.mimetype,
			});

			paymentProof = secureUrl;
		}

		const reference = referenceGenerator();
		const transaction = await transactionRepository.create({
			userId: user.id,
			amount,
			type: 'Deposit',
			description: 'Wallet Deposit',
			reference,
			crypto,
			address,
			paymentProof,
		});
		if (!transaction) throw new AppError('Failed to create wallet top up transaction', 500);

		await sendProcessingDepositEmail(user.email, user.firstName, amount, reference);
		return AppResponse(res, 200, toJSON(transaction), 'Transaction created successfully');
	});

	withdrawFunds = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { amount, crypto, address } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!amount) throw new AppError('Amount is required', 400);
		if (!crypto) throw new AppError('Crypto is required', 400);
		if (!address) throw new AppError('Crypto Address is required', 400);

		let wallet = await walletRepository.findByUserId(user.id);
		if (!wallet || wallet.length === 0) {
			wallet = await walletRepository.create({ userId: user.id });
		}

		const availableBalance = wallet[0]?.balance + wallet[0]?.portfolioBalance || 0;
		if (amount > availableBalance) {
			throw new AppError('Insufficient Funds', 400);
		}

		const reference = referenceGenerator();
		const transaction = await transactionRepository.create({
			userId: user.id,
			amount,
			type: 'withdrawal',
			description: 'Withdrawal',
			reference,
			crypto,
			address,
		});
		if (!transaction) throw new AppError('Failed to create withdrawal request', 500);

		await sendProcessingWithdrawalEmail(user.email, user.firstName, amount, reference);
		return AppResponse(res, 200, toJSON(transaction), 'Withdrawal successfully');
	});

	updateTransaction = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { transactionId, status } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (user.role !== 'admin') throw new AppError('Unauthorized', 400);
		if (!transactionId) throw new AppError('Transaction ID is required', 400);

		const transaction = await transactionRepository.findById(transactionId);
		if (!transaction) throw new AppError('No transaction found', 404);

		const update = await transactionRepository.update(transactionId, {
			status,
		});
		if (!update) throw new AppError('Failed to update transaction', 500);

		return AppResponse(res, 200, toJSON(update), 'Transacions updated successfully');
	});
}

export const transactionController = new TransactionController();
