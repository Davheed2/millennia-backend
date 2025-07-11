import { Request, Response } from 'express';
import {
	AppError,
	AppResponse,
	referenceGenerator,
	sendFailedDepositEmail,
	sendFailedWithdrawalEmail,
	sendProcessingDepositEmail,
	sendProcessingWithdrawalEmail,
	sendSuccessfulDepositEmail,
	sendSuccessfulWithdrawalEmail,
	toJSON,
	uploadPaymentProofFile,
} from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { transactionRepository, userRepository, walletRepository } from '@/repository';

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
			const { secureUrl } = await uploadPaymentProofFile({
				fileName: `payment-proof/${Date.now()}-${file.originalname}`,
				buffer: file.buffer,
				mimetype: file.mimetype,
			});

			paymentProof = secureUrl;
		}

		let wallet = await walletRepository.findByUserId(user.id);
		if (!wallet || wallet.length === 0) {
			wallet = await walletRepository.create({ userId: user.id });
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
		if (Number(amount) > availableBalance) {
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

		return AppResponse(res, 200, toJSON(update), 'Transaction updated successfully');
	});

	updateDeposit = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { transactionId, status, userId } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (user.role !== 'admin') throw new AppError('Unauthorized', 403);
		if (!transactionId) throw new AppError('Transaction ID is required', 400);
		if (!userId) throw new AppError('User ID is required', 400);

		const transaction = await transactionRepository.findById(transactionId);
		if (!transaction) throw new AppError('No transaction found', 404);

		const extinguishUser = await userRepository.findById(userId);
		if (!extinguishUser) throw new AppError('No User found', 404);

		const update = await transactionRepository.update(transactionId, {
			status,
		});
		if (!update) throw new AppError('Failed to update transaction', 500);

		let userWallet = await walletRepository.findByUserId(userId);
		if (!userWallet || userWallet.length === 0) {
			userWallet = await walletRepository.create({
				userId,
			});
		}

		if (status === 'completed') {
			await walletRepository.update(userWallet[0].id, {
				balance: (userWallet[0].balance += transaction.amount),
			});

			await sendSuccessfulDepositEmail(
				extinguishUser.email,
				extinguishUser.firstName,
				transaction.amount,
				transaction.reference
			);
		}
		if (status === 'failed') {
			await sendFailedDepositEmail(
				extinguishUser.email,
				extinguishUser.firstName,
				transaction.amount,
				transaction.reference
			);
		}

		return AppResponse(res, 200, toJSON(update), 'Transaction updated successfully');
	});

	updateWithdrawal = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { transactionId, status, userId } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (user.role !== 'admin') throw new AppError('Unauthorized', 403);
		if (!transactionId) throw new AppError('Transaction ID is required', 400);
		if (!userId) throw new AppError('User ID is required', 400);

		const transaction = await transactionRepository.findById(transactionId);
		if (!transaction) throw new AppError('No transaction found', 404);

		const extinguishUser = await userRepository.findById(userId);
		if (!extinguishUser) throw new AppError('No User found', 404);

		const update = await transactionRepository.update(transactionId, {
			status,
		});
		if (!update) throw new AppError('Failed to update transaction', 500);

		let userWallet = await walletRepository.findByUserId(userId);
		if (!userWallet || userWallet.length === 0) {
			userWallet = await walletRepository.create({
				userId,
			});
		}

		const withdrawable = userWallet[0].balance + userWallet[0].portfolioBalance;
		if (withdrawable < transaction.amount) {
			throw new AppError('Insufficient funds', 400);
		}

		if (status === 'completed') {
			const wallet = userWallet[0];
			let remainingAmount = transaction.amount;

			let newBalance = wallet.balance;
			let newPortfolioBalance = wallet.portfolioBalance;

			// Subtract from balance first
			if (remainingAmount <= newBalance) {
				newBalance -= remainingAmount;
				remainingAmount = 0;
			} else {
				remainingAmount -= newBalance;
				newBalance = 0;
			}

			// Subtract remainder from portfolio balance
			if (remainingAmount > 0) {
				if (remainingAmount > newPortfolioBalance) {
					throw new AppError('Insufficient funds in portfolio balance', 400);
				}
				newPortfolioBalance -= remainingAmount;
			}

			await walletRepository.update(wallet.id, {
				balance: newBalance,
				portfolioBalance: newPortfolioBalance,
			});

			await sendSuccessfulWithdrawalEmail(
				extinguishUser.email,
				extinguishUser.firstName,
				transaction.amount,
				transaction.reference
			);
		}

		if (status === 'failed') {
			await sendFailedWithdrawalEmail(
				extinguishUser.email,
				extinguishUser.firstName,
				transaction.amount,
				transaction.reference
			);
		}

		return AppResponse(res, 200, toJSON(update), 'Transaction updated successfully');
	});

	fetchDeposits = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 400);
		if (user.role === 'user') throw new AppError('Unauthorized', 403);

		const deposits = await transactionRepository.findDeposits();
		if (!deposits) {
			throw new AppError('No deposits found', 404);
		}

		return AppResponse(res, 200, toJSON(deposits), 'Deposits fetched successfully');
	});

	fetchWithdrawals = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 400);
		if (user.role === 'user') throw new AppError('Unauthorized', 403);

		const deposits = await transactionRepository.findWithdrawals();
		if (!deposits) {
			throw new AppError('No deposits found', 404);
		}

		return AppResponse(res, 200, toJSON(deposits), 'Withdrawals fetched successfully');
	});
}

export const transactionController = new TransactionController();
