import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { assetsRepository } from '@/repository';

export class AssetsController {
	getAllStocks = catchAsync(async (req: Request, res: Response) => {
		const stocks = await assetsRepository.getAllStocks();
		if (!stocks) {
			throw new AppError('No stocks found', 404);
		}

		return AppResponse(res, 200, toJSON(stocks), 'Stocks retreived successfully');
	});

    getAllEtfs = catchAsync(async (req: Request, res: Response) => {
		const etfs = await assetsRepository.getAllETFs();
		if (!etfs) {
			throw new AppError('No etf found', 404);
		}

		return AppResponse(res, 200, toJSON(etfs), 'ETFS retreived successfully');
	});
}

export const assetsController = new AssetsController();
