import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { transactionRepository, walletRepository } from '@/repository';
import { TransactionStatus } from '@/common/constants';

export class WalletController {
	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		let wallet = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
		if (!wallet || wallet.length === 0) {
			wallet = await walletRepository.create({
				userId: user.id,
				isDemo: req.isDemoMode || false,
			});
		}

		return AppResponse(res, 200, toJSON(wallet), 'User Wallet retrieved successfully');
	});

	fundDemo = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!req.isDemoMode) {
			throw new AppError('This endpoint is only available in demo mode', 400);
		}
		
		let wallet = await walletRepository.findByUserId(user.id, true);
		if (!wallet || wallet.length === 0) {
			wallet = await walletRepository.create({
				userId: user.id,
				isDemo: true,
				balance: 50000
			});
		} else {
			const currentBalance = Number(wallet[0].balance || 0);
			wallet = await walletRepository.update(wallet[0].id, {
				balance: currentBalance + 50000
			});
		}
		
		await transactionRepository.create({
			userId: user.id,
			amount: 50000,
			type: 'Deposit',
			status: TransactionStatus.COMPLETED,
			description: 'Demo Account Funding',
			reference: `DEMO-DEP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
			isDemo: true
		});
		
		return AppResponse(res, 200, toJSON(wallet), 'Demo wallet funded successfully');
	});
}

export const walletController = new WalletController();
