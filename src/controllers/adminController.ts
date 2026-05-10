import { Request, Response } from 'express';
import { AppError, AppResponse, paginate, toJSON, logger } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { assetsRepository, traderRepository, userRepository, transactionRepository } from '@/repository';
import { Role } from '@/common/constants';
import { knexDb } from '@/common/config';
import { runDailyInvestmentCron } from '@/jobs/investments';
import { addEmailToQueue } from '@/queues/emailQueue';

export class AdminController {
	// Trader Management
	getAllTraders = catchAsync(async (req: Request, res: Response) => {
		const { page, limit } = req.query;
		
		const query = knexDb.table('traders').select('*').orderBy('totalProfitPercent', 'desc');
		const paginatedTraders = await paginate(query, { 
			page: Number(page), 
			limit: Number(limit) 
		});

		return AppResponse(res, 200, toJSON(paginatedTraders), 'Traders retrieved successfully');
	});

	updateTraderStatus = catchAsync(async (req: Request, res: Response) => {
		const { traderId, isActive } = req.body;
		if (traderId === undefined || isActive === undefined) {
			throw new AppError('Trader ID and active status are required', 400);
		}

		const updatedTrader = await traderRepository.update(traderId, { isActive });
		if (!updatedTrader) {
			throw new AppError('Trader not found or update failed', 404);
		}

		return AppResponse(res, 200, toJSON(updatedTrader), `Trader status updated to ${isActive ? 'Active' : 'Inactive'}`);
	});

	// Asset Management
	getAllAssets = catchAsync(async (req: Request, res: Response) => {
		const { page, limit, type } = req.query;

		const query = knexDb.table('assets')
			.leftJoin('asset_metrics', 'assets.id', '=', 'asset_metrics.asset_id')
			.select(
				'assets.*',
				'asset_metrics.price',
				'asset_metrics.change_dollar',
				'asset_metrics.change_percentage'
			)
			.orderBy('assets.created_at', 'desc');

		if (type && type !== 'all') {
			query.where('assets.type', type as string);
		}

		const paginatedAssets = await paginate(query, {
			page: Number(page),
			limit: Number(limit)
		});

		return AppResponse(res, 200, toJSON(paginatedAssets), 'All assets retrieved successfully');
	});

	createAsset = catchAsync(async (req: Request, res: Response) => {
		const { symbol, name, type, sector } = req.body;
		if (!symbol || !name || !type) {
			throw new AppError('Symbol, Name, and Type are required', 400);
		}

		const existing = await assetsRepository.findBySymbol(symbol);
		if (existing) {
			throw new AppError('Asset with this symbol already exists', 400);
		}

		const [newAsset] = await knexDb.table('assets').insert({
			symbol,
			name,
			type,
			sector: sector || null
		}).returning('*');

		// Create default metrics entry
		await knexDb.table('asset_metrics').insert({
			asset_id: newAsset.id,
			price: 0,
			change_percentage: 0,
			change_dollar: 0,
			volume: 0,
			market_cap: 0
		});

		return AppResponse(res, 201, toJSON(newAsset), 'Asset created successfully');
	});

	deleteAsset = catchAsync(async (req: Request, res: Response) => {
		const { assetId } = req.params;
		if (!assetId) throw new AppError('Asset ID is required', 400);

		// Cascading delete is handled by DB migration (onDelete: 'CASCADE')
		const deletedCount = await knexDb.table('assets').where({ id: assetId }).del();

		if (deletedCount === 0) {
			throw new AppError('Asset not found', 404);
		}

		return AppResponse(res, 200, null, 'Asset deleted successfully');
	});

	// Performance Monitoring
	getPlatformPerformance = catchAsync(async (req: Request, res: Response) => {
		const stats = await userRepository.findStats();

		const openTradesCount = await knexDb
			.table('follower_trades')
			.where({ status: 'open' })
			.count('* as count')
			.first<{ count: string }>();
		const totalProfit = await knexDb
			.table('follower_trades')
			.where({ status: 'closed' })
			.sum('profitLoss as total')
			.first<{ total: string | null }>();

		// Find the most recent completed investment payout run from logs
		const lastPayout = await knexDb
			.table('payout_logs')
			.where({ status: 'completed' })
			.orderBy('date', 'desc')
			.select('date')
			.first<{ date: string } | undefined>();

		const consolidated = {
			...stats,
			realTimePnL: Number(totalProfit?.total) || 0,
			activeFannedTrades: Number(openTradesCount?.count) || 0,
			lastPayoutAt: lastPayout?.date || null,
		};

		return AppResponse(res, 200, toJSON(consolidated), 'Platform performance metrics retrieved');
	});

	// Payout Management
	getPayoutLogs = catchAsync(async (req: Request, res: Response) => {
		const { limit = 50 } = req.query;
		
		const logs = await knexDb.table('payout_logs')
			.select('*')
			.orderBy('date', 'desc')
			.limit(Number(limit));
			
		return AppResponse(res, 200, toJSON(logs), 'Payout logs retrieved successfully');
	});

	triggerManualPayout = catchAsync(async (req: Request, res: Response) => {
		// Fire the cron in the background so the request returns immediately
		runDailyInvestmentCron().catch((err) =>
			logger.error('Manual payout cron failed:', err)
		);

		return AppResponse(res, 200, null, 'Global payout job has been triggered and is running in the background');
	});

	// Broadcast
	broadcastAnnouncement = catchAsync(async (req: Request, res: Response) => {
		const { title, content } = req.body;
		if (!title || !content) {
			throw new AppError('Title and content are required for broadcast', 400);
		}

		// Fetch all active user emails
		const users = await knexDb
			.table('users')
			.select('email')
			.where({ is_active: true });

		if (!users.length) {
			return AppResponse(res, 200, { enqueued: 0 }, 'No active users to broadcast to');
		}

		// Enqueue one email job per user
		let enqueued = 0;
		for (const user of users) {
			try {
				await addEmailToQueue({
					type: 'broadcastEmail',
					data: {
						to: user.email,
						priority: 'normal',
						title,
						content,
					},
				});
				enqueued++;
			} catch (err) {
				logger.error(`Failed to enqueue broadcast for ${user.email}:`, err);
			}
		}

		logger.info(`Broadcast "${title}" enqueued for ${enqueued}/${users.length} users`);
		return AppResponse(res, 200, { enqueued, total: users.length }, `Broadcast queued for ${enqueued} users`);
	});

	// Trader Detail Updates
	updateTraderDetails = catchAsync(async (req: Request, res: Response) => {
		const { traderId, commissionRate, riskLevel, assetFocus } = req.body;
		if (!traderId) {
			throw new AppError('Trader ID is required', 400);
		}

		const updatePayload: Record<string, unknown> = {};
		if (commissionRate !== undefined) updatePayload.commissionRate = commissionRate;
		if (riskLevel !== undefined) updatePayload.riskLevel = riskLevel;
		if (assetFocus !== undefined) updatePayload.assetFocus = assetFocus;

		if (Object.keys(updatePayload).length === 0) {
			throw new AppError('At least one field (commissionRate, riskLevel, assetFocus) must be provided', 400);
		}

		const updatedTrader = await traderRepository.update(traderId, updatePayload);
		if (!updatedTrader) {
			throw new AppError('Trader not found or update failed', 404);
		}

		return AppResponse(res, 200, toJSON(updatedTrader), 'Trader details updated successfully');
	});
}

export const adminController = new AdminController();
