import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { copySubscriptionRepository, traderRepository, walletRepository, followerTradeRepository } from '@/repository';
import { SubscriptionStatus } from '@/common/interfaces';

export class CopyController {
	subscribe = catchAsync(async (req: any, res: Response) => {
		const followerId = req.user.id;
		const { traderId, allocatedAmount, maxLossPercent } = req.body;

		if (!traderId || !allocatedAmount) {
			throw new AppError('Trader ID and allocated amount are required', 400);
		}

		// 1. Find the trader
		const trader = await traderRepository.findById(traderId);
		if (!trader) throw new AppError('Trader not found', 404);
		if (!trader.isActive) throw new AppError('Trader is currently not accepting new followers', 400);
		if (allocatedAmount < trader.minCopyAmount) {
			throw new AppError(`Minimum copy amount for this trader is $${trader.minCopyAmount}`, 400);
		}

		// 2. Check existing subscription
		const existingSub = await copySubscriptionRepository.findByFollowerAndTrader(followerId, traderId, req.isDemoMode || false);
		if (existingSub) throw new AppError('You are already following this trader', 400);

		// 3. Check wallet balance
		const [wallet] = await walletRepository.findByUserId(followerId, req.isDemoMode || false);
		if (!wallet || wallet.balance < allocatedAmount) {
			throw new AppError('Insufficient balance to start copying', 400);
		}

		// 4. Create subscription
		const [subscription] = await copySubscriptionRepository.create({
			followerId,
			traderId,
			allocatedAmount,
			copyRatio: 1.0, // Default to 1:1, can be logic-based later
			status: SubscriptionStatus.ACTIVE,
			isDemo: req.isDemoMode || false,
		});

		// 5. Update wallet balances (Lock funds)
		await walletRepository.update(wallet.id, {
			balance: wallet.balance - allocatedAmount,
			portfolioBalance: wallet.portfolioBalance + allocatedAmount,
		});

		// 6. Increment trader follower count
		await traderRepository.incrementFollowers(traderId);

		return AppResponse(res, 201, toJSON(subscription), `Now following ${trader.displayName}`);
	});

	unsubscribe = catchAsync(async (req: any, res: Response) => {
		const followerId = req.user.id;
		const { subscriptionId } = req.params;

		const subscription = await copySubscriptionRepository.findById(subscriptionId);
		if (!subscription || subscription.followerId !== followerId) {
			throw new AppError('Subscription not found', 404);
		}

		// Calculate refund (initial allocation + profit/loss)
		const refundAmount = Number(subscription.allocatedAmount) + Number(subscription.totalProfitLoss);

		// 1. Update wallet balance (Unlock funds)
		const [wallet] = await walletRepository.findByUserId(followerId, req.isDemoMode || false);
		if (wallet) {
			await walletRepository.update(wallet.id, {
				balance: Number(wallet.balance) + refundAmount,
				portfolioBalance: Math.max(0, Number(wallet.portfolioBalance) - Number(subscription.allocatedAmount)),
			});
		}

		// 2. Decrement trader followers
		await traderRepository.decrementFollowers(subscription.traderId);

		// 3. Delete subscription (or mark as stopped)
		await copySubscriptionRepository.update(subscriptionId, { status: SubscriptionStatus.STOPPED });

		return AppResponse(res, 200, null, 'Successfully stopped following trader');
	});

	getMySubscriptions = catchAsync(async (req: any, res: Response) => {
		const followerId = req.user.id;
		const subscriptions = await copySubscriptionRepository.findSubscriptionsByFollower(followerId, req.isDemoMode || false);
		return AppResponse(res, 200, toJSON(subscriptions), 'Subscriptions retrieved successfully');
	});

	getTraderFollowers = catchAsync(async (req: any, res: Response) => {
		const userId = req.user.id;
		const trader = await traderRepository.findByUserId(userId);
		if (!trader) throw new AppError('Trader profile not found', 404);

		const followers = await copySubscriptionRepository.findTopFollowersByTrader(trader.id);
		return AppResponse(res, 200, toJSON(followers), 'Followers retrieved successfully');
	});

	getUserPositions = catchAsync(async (req: any, res: Response) => {
		const followerId = req.user.id;
		const trades = await followerTradeRepository.findOpenTradesByFollower(followerId, req.isDemoMode || false);
		
		const positions = trades.map((trade: any) => {
			return {
				id: trade.id,
				traderId: trade.traderId,
				traderName: trade.displayName || 'Unknown Trader',
				traderAvatar: null,
				symbol: trade.symbol,
				amount: trade.size || 0,
				entryPrice: trade.entryPrice,
				currentPrice: trade.exitPrice || trade.entryPrice,
				pnl: trade.profitLoss || 0,
				pnlPercent: trade.entryPrice && trade.size ? ((trade.profitLoss || 0) / (trade.size * trade.entryPrice)) * 100 : 0,
				allocationPercent: 0,
				stopLoss: 0,
				takeProfit: 0,
				status: trade.status === 'open' ? 'active' : 'closed',
				closedAt: trade.closedAt,
			};
		});

		return AppResponse(res, 200, toJSON(positions), 'User copy positions retrieved successfully');
	});
}

export const copyController = new CopyController();
