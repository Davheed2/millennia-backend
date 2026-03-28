import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { sysCryptoRepository } from '@/repository/sysCryptoRepository';

export class SysCryptoController {
	getGlobalAddress = catchAsync(async (req: Request, res: Response) => {
		const cryptoInfo = await sysCryptoRepository.get();
		return AppResponse(res, 200, toJSON(cryptoInfo || { crypto: 'BTC', address: '' }), 'Settings retrieved successfully');
	});

	updateGlobalAddress = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { crypto, address } = req.body;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}
		if (!address) {
			throw new AppError('Crypto Address is required', 400);
		}

		const updated = await sysCryptoRepository.upsert(crypto || 'BTC', address);
		return AppResponse(res, 200, toJSON(updated), 'Global crypto address updated successfully');
	});
}

export const sysCryptoController = new SysCryptoController();
