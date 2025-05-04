import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { walletRepository } from '@/repository';

export class WalletController {
	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const wallet = await walletRepository.findByUserId(user.id);
		if (!wallet)
			await walletRepository.create({
				userId: user.id,
			});

		return AppResponse(res, 200, toJSON(wallet), 'User Wallet retrieved successfully');
	});
}

export const walletController = new WalletController();
