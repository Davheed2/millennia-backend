import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { tradeRepository, traderRepository, traderStatsRepository } from '@/repository';
import { TradeStatus, TradeDirection } from '@/common/interfaces';
import { addCopyJob } from '@/queues';

export class TradeController {
	openTrade = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;
		const trader = await traderRepository.findByUserId(userId);
		if (!trader) throw new AppError('Only registered traders can open trades', 403);

		const { assetType, symbol, direction, entryPrice, size, leverage, notes } = req.body;

		if (!assetType) throw new AppError('assetType is required', 400);
		if (!symbol) throw new AppError('symbol is required', 400);
		if (!direction) throw new AppError('direction is required', 400);
		if (!entryPrice) throw new AppError('entryPrice is required', 400);
		if (!size) throw new AppError('size is required', 400);

		const [trade] = await tradeRepository.create({
			traderId: trader.id,
			assetType,
			symbol,
			direction: direction as TradeDirection,
			entryPrice,
			size,
			leverage: leverage || 1,
			status: TradeStatus.OPEN,
			notes,
			openedAt: new Date(),
		});

		// Trigger Fan-Out Queue (Phase 3)
		await addCopyJob('OPEN_TRADE', {
			masterTradeId: trade.id,
			traderId: trader.id,
			symbol,
			direction,
			entryPrice,
			size,
		});

		return AppResponse(res, 201, toJSON(trade), 'Master trade opened successfully');
	});

	closeTrade = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;
		const { id } = req.params;
		const { exitPrice } = req.body;

		const trader = await traderRepository.findByUserId(userId);
		if (!trader) throw new AppError('Forbidden', 403);

		const trade = await tradeRepository.findById(id);
		if (!trade || trade.traderId !== trader.id) {
			throw new AppError('Trade not found', 404);
		}

		if (trade.status !== TradeStatus.OPEN) {
			throw new AppError('Trade is already closed', 400);
		}

		// Calculate P&L
		const pnlFactor = trade.direction === TradeDirection.BUY ? 1 : -1;
		const profitLossPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * pnlFactor * trade.leverage;
		const profitLoss = trade.size * profitLossPercent;

		const [updatedTrade] = await tradeRepository.update(id, {
			exitPrice,
			status: TradeStatus.CLOSED,
			profitLoss,
			profitLossPercent,
			closedAt: new Date(),
		});

		// Trigger Close-Fan-Out Queue (Phase 3)
		await addCopyJob('CLOSE_TRADE', {
			masterTradeId: id,
			exitPrice,
			closedAt: updatedTrade.closedAt,
		});

		return AppResponse(res, 200, toJSON(updatedTrade), 'Master trade closed successfully');
	});

	getLeaderboard = catchAsync(async (req: Request, res: Response) => {
		const leaderboard = await traderStatsRepository.getLeaderboard(20);
		return AppResponse(res, 200, toJSON(leaderboard), 'Leaderboard retrieved successfully');
	});

	getTraderTrades = catchAsync(async (req: Request, res: Response) => {
		const { traderId } = req.params;
		const trades = await tradeRepository.findOpenTradesByTrader(traderId);
		const history = await tradeRepository.findTradesHistoryByTrader(traderId);

		return AppResponse(res, 200, toJSON({ open: trades, history }), 'Trader trades retrieved successfully');
	});
}

export const tradeController = new TradeController();
