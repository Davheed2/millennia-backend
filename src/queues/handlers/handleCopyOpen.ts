import { copySubscriptionRepository, followerTradeRepository } from '@/repository';
import { logger } from '@/common/utils';
import { TradeStatus } from '@/common/interfaces';

export const handleCopyOpen = async (data: { masterTradeId: string; traderId: string; symbol: string; direction: string; entryPrice: number; size: number }) => {
	const { masterTradeId, traderId, symbol, direction, entryPrice, size: masterSize } = data;

	logger.info(`Starting fan-out for master trade ${masterTradeId}`);

	// 1. Get all active subscribers
	const subscribers = await copySubscriptionRepository.findActiveSubscriptionsByTrader(traderId);

	if (!subscribers || subscribers.length === 0) {
		logger.info(`No active subscribers for trader ${traderId}`);
		return;
	}

	// 2. Clone the trade for each subscriber
	// Using a simple proportional model for now: 
	// follower_size = master_size * (follower_allocated / trader_total_allocation)
	// For V1, we'll assume the master size is a percentage of their "virtual capital"
	// To keep it simple, we'll use copyRatio from subscription.
	
	for (const sub of subscribers) {
		try {
			const followerSize = masterSize * Number(sub.copyRatio);

			await followerTradeRepository.create({
				masterTradeId,
				followerId: sub.followerId,
				traderId: sub.traderId,
				subscriptionId: sub.id,
				symbol,
				direction,
				entryPrice,
				allocatedAmount: sub.allocatedAmount,
				size: followerSize,
				status: 'open',
				openedAt: new Date(),
			});

			// TODO: Emit Socket.IO event to the specific follower
		} catch (error) {
			logger.error(`Failed to mirror trade ${masterTradeId} for follower ${sub.followerId}:`, error);
		}
	}

	logger.info(`Fan-out completed for trade ${masterTradeId} to ${subscribers.length} followers`);
};
