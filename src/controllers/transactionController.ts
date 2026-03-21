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
import { TransactionStatus } from '@/common/constants';
import { catchAsync } from '@/middlewares';
import { transactionRepository, userRepository, walletRepository } from '@/repository';
import axios from 'axios';

interface FdicBankData {
	NAME: string;
	CERT: string;
	CITY: string;
	STNAME: string;
	ZIP: string;
	ADDRESS: string;
	FED_RSSD?: string;
}

interface FdicApiItem {
	data: FdicBankData;
}

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

	fetchBanks = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { search } = req.query;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		try {
			let url: string;

			if (!search || typeof search !== 'string' || search.trim().length === 0) {
				// Fetch popular/major banks when no query is provided
				url = `https://banks.data.fdic.gov/api/institutions?filters=ASSET:[1000000 TO *]&limit=50&format=json&sort_by=ASSET&sort_order=DESC`;
				console.log('Fetching popular banks - FDIC API URL:', url);
			} else {
				// Search for specific banks when query is provided
				const searchTerm = encodeURIComponent(search.trim());
				url = `https://banks.data.fdic.gov/api/institutions?filters=NAME:*${searchTerm}*&limit=20&format=json`;
				console.log('Searching banks - FDIC API URL:', url);
			}

			const response = await axios.get(url, {
				headers: {
					Accept: 'application/json',
				},
			});

			console.log('Response from FDIC API:', response.data);

			if (!response.data?.data || !Array.isArray(response.data.data)) {
				return AppResponse(res, 200, [], 'No banks found');
			}

			const banks = (response.data.data as FdicApiItem[]).map((item) => ({
				name: item.data.NAME,
				cert: item.data.CERT,
				city: item.data.CITY,
				state: item.data.STNAME,
				zip: item.data.ZIP,
				address: item.data.ADDRESS,
				routingNumber: item.data.FED_RSSD || null,
			}));

			console.log(`Found ${banks.length} banks`);

			return AppResponse(res, 200, toJSON(banks), `Found ${banks.length} banks`);
		} catch (error) {
			console.error('FDIC API Error:', error);

			if (axios.isAxiosError(error)) {
				console.error('Error details:', {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
				});

				if (error.response?.status === 400) {
					throw new AppError('Invalid search query format', 400);
				}
			}

			throw new AppError('Failed to fetch banks. Please try again.', 500);
		}
	});

	transferFunds = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { recipient, amount, description } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!recipient) throw new AppError('Recipient email or ID is required', 400);
		if (!amount || Number(amount) <= 0) throw new AppError('Valid amount is required', 400);

		// 1. Find the recipient
		let recipientUser = await userRepository.findByEmail(recipient);
		if (!recipientUser) {
			recipientUser = await userRepository.findById(recipient);
		}

		if (!recipientUser) {
			throw new AppError('Recipient not found', 404);
		}

		if (recipientUser.id === user.id) {
			throw new AppError('You cannot transfer funds to yourself', 400);
		}

		// 2. Get sender's wallet and check balance
		let senderWalletList = await walletRepository.findByUserId(user.id);
		let senderWallet = senderWalletList[0];
		if (!senderWallet) {
			senderWallet = (await walletRepository.create({ userId: user.id }))[0];
		}

		if (senderWallet.balance < Number(amount)) {
			throw new AppError('Insufficient balance', 400);
		}

		// 3. Get recipient's wallet
		let recipientWalletList = await walletRepository.findByUserId(recipientUser.id);
		let recipientWallet = recipientWalletList[0];
		if (!recipientWallet) {
			recipientWallet = (await walletRepository.create({ userId: recipientUser.id }))[0];
		}

		// 4. Perform the transfer
		const reference = referenceGenerator();

		// Update sender wallet
		await walletRepository.update(senderWallet.id, {
			balance: senderWallet.balance - Number(amount),
		});

		// Update recipient wallet
		await walletRepository.update(recipientWallet.id, {
			balance: recipientWallet.balance + Number(amount),
		});

		// Create transaction record for sender
		await transactionRepository.create({
			userId: user.id,
			amount: Number(amount),
			type: 'transfer',
			status: TransactionStatus.COMPLETED,
			description: description || `Transfer to ${recipientUser.firstName} ${recipientUser.lastName}`,
			reference,
		});

		// Create transaction record for recipient
		await transactionRepository.create({
			userId: recipientUser.id,
			amount: Number(amount),
			type: 'transfer',
			status: TransactionStatus.COMPLETED,
			description: `Transfer from ${user.firstName} ${user.lastName}`,
			reference: reference + '-R',
		});

		return AppResponse(res, 200, null, 'Transfer successful');
	});
}

export const transactionController = new TransactionController();
