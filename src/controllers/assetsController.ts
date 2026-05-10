import { Request, Response } from 'express';
import { AppError, AppResponse, paginate, toJSON } from '@/common/utils';
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

	getAssetsByType = catchAsync(async (req: Request, res: Response) => {
		const { type, page, limit } = req.query;
		if (!type) throw new AppError('Asset type is required', 400);

		const query = assetsRepository.getByTypeQuery(type as string);
		const paginatedAssets = await paginate(query, {
			page: Number(page) || 1,
			limit: Number(limit) || 20,
		});
		return AppResponse(res, 200, toJSON(paginatedAssets), `${type} assets retrieved successfully`);
	});

	getMarketSummary = catchAsync(async (req: Request, res: Response) => {
		const summary = await assetsRepository.getMarketSummary();
		return AppResponse(res, 200, toJSON(summary), 'Market summary retrieved successfully');
	});
}

export const assetsController = new AssetsController();
