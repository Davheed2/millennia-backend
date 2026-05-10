import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { traderRepository, traderStatsRepository } from '@/repository';
import { RiskLevel, AssetFocus } from '@/common/interfaces';

export class TraderController {
	registerAsTrader = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;

		// Check if already a trader
		const existingTrader = await traderRepository.findByUserId(userId);
		if (existingTrader) {
			throw new AppError('You are already registered as a trader', 400);
		}

		const { displayName, bio, avatarUrl, riskLevel, assetFocus, commissionRate, minCopyAmount } = req.body;

		const [trader] = await traderRepository.create({
			userId,
			displayName: displayName || req.user.firstName + ' ' + req.user.lastName,
			bio,
			avatarUrl: avatarUrl || req.user.profilePicture,
			riskLevel: riskLevel || RiskLevel.MEDIUM,
			assetFocus: assetFocus || AssetFocus.BOTH,
			commissionRate: commissionRate || 10,
			minCopyAmount: minCopyAmount || 100,
		});

		// Initialize stats
		await traderStatsRepository.create({ traderId: trader.id });

		return AppResponse(res, 201, toJSON(trader), 'Successfully registered as a trader');
	});

	getAllTraders = catchAsync(async (req: Request, res: Response) => {
		const { riskLevel, assetFocus } = req.query;
		const traders = await traderRepository.findAll({
			riskLevel: riskLevel as string,
			assetFocus: assetFocus as string,
			isActive: true,
		});

		return AppResponse(res, 200, toJSON(traders), 'Traders retrieved successfully');
	});

	getTraderProfile = catchAsync(async (req: Request, res: Response) => {
		const { id } = req.params;
		const trader = await traderRepository.findById(id);
		if (!trader) {
			throw new AppError('Trader not found', 404);
		}

		const stats = await traderStatsRepository.findByTraderId(id);

		return AppResponse(res, 200, toJSON({ ...trader, stats }), 'Trader profile retrieved successfully');
	});

	updateProfile = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;
		const trader = await traderRepository.findByUserId(userId);
		if (!trader) {
			throw new AppError('Trader profile not found', 404);
		}

		const updatedTrader = await traderRepository.update(trader.id, req.body);
		return AppResponse(res, 200, toJSON(updatedTrader), 'Trader profile updated successfully');
	});

	getOwnTraderProfile = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;
		const trader = await traderRepository.findByUserId(userId);
		if (!trader) {
			return AppResponse(res, 200, null, 'No trader profile found for this user');
		}

		const stats = await traderStatsRepository.findByTraderId(trader.id);
		return AppResponse(res, 200, toJSON({ ...trader, stats }), 'Trader profile retrieved successfully');
	});
}

export const traderController = new TraderController();
