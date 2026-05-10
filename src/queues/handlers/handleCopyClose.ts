import { 
    followerTradeRepository, 
    copySubscriptionRepository, 
    walletRepository, 
    traderRepository,
    traderStatsRepository 
} from '@/repository';
import { logger } from '@/common/utils';
import { TradeDirection } from '@/common/interfaces';

export const handleCopyClose = async (data: { masterTradeId: string; exitPrice: number; closedAt: Date }) => {
	const { masterTradeId, exitPrice: masterExitPrice, closedAt } = data;

	logger.info(`Starting settlement fan-out for master trade ${masterTradeId}`);

	// 1. Find all open mirrored trades
	const followerTrades = await followerTradeRepository.findOpenTradesByMasterTrade(masterTradeId);

	if (!followerTrades || followerTrades.length === 0) {
		logger.info(`No follower positions to close for master trade ${masterTradeId}`);
		return;
	}

	for (const ft of followerTrades) {
		try {
			// Simulate small slippage for followers (0 to 0.1%)
			const slippage = 1 - (Math.random() * 0.001);
			const followerExitPrice = masterExitPrice * slippage;

			// Calculate P&L
			const pnlFactor = ft.direction === TradeDirection.BUY ? 1 : -1;
			const profitLossPercent = ((followerExitPrice - ft.entryPrice) / ft.entryPrice) * pnlFactor;
			const grossProfitLoss = ft.size * profitLossPercent;

			// Handle Commission
			let commission = 0;
			let netProfitLoss = grossProfitLoss;

			if (grossProfitLoss > 0) {
				const trader = await traderRepository.findById(ft.traderId);
				const commissionRate = trader?.commissionRate || 10;
				commission = grossProfitLoss * (commissionRate / 100);
				netProfitLoss = grossProfitLoss - commission;
			}

			// 1. Update follower trade record
			await followerTradeRepository.update(ft.id, {
				exitPrice: followerExitPrice,
				status: 'closed',
				profitLoss: netProfitLoss,
				commissionPaid: commission,
				closedAt,
			});

			// 2. Update subscription aggregate P&L
			const sub = await copySubscriptionRepository.findById(ft.subscriptionId);
			if (sub) {
				await copySubscriptionRepository.update(sub.id, {
					totalProfitLoss: Number(sub.totalProfitLoss) + netProfitLoss,
				});
			}

			// 3. Update Follower Wallet
			// Note: allocatedAmount is already out of 'balance' and in 'portfolioBalance'
			// On trade close, we don't necessarily move the capital back to 'balance' unless they unsubscribe,
			// but we update the 'portfolioBalance' to reflect current value.
            // Actually, many systems keep it in 'portfolioBalance' until the user stops copying.
            // Let's just update the balances.
			const [followerWallet] = await walletRepository.findByUserId(ft.followerId);
			if (followerWallet) {
				await walletRepository.update(followerWallet.id, {
					portfolioBalance: Number(followerWallet.portfolioBalance) + netProfitLoss,
				});
			}

			// 4. Update Trader Wallet (Commission)
			if (commission > 0) {
				const traderRecord = await traderRepository.findById(ft.traderId);
				if (traderRecord) {
					const [traderWallet] = await walletRepository.findByUserId(traderRecord.userId);
					if (traderWallet) {
						await walletRepository.update(traderWallet.id, {
							balance: Number(traderWallet.balance) + commission,
						});
					}
				}
			}

		} catch (error) {
			logger.error(`Failed to settle trade ${ft.id} for follower ${ft.followerId}:`, error);
		}
	}

    // 5. Update Trader Stats (Win Rate, Total P&L, etc.)
    // This could be moved to a separate job or handled at the end of the loop
    const masterTrade = await followerTrades[0]; // Get traderId from the first follower trade
    if (masterTrade) {
        await updateTraderAggregatedStats(masterTrade.traderId);
    }

	logger.info(`Settlement fan-out completed for master trade ${masterTradeId}`);
};

async function updateTraderAggregatedStats(traderId: string) {
    try {
        // Logic to recalculate winRate and totalProfitLoss for the leaderboard
        // This is a simplified version
        const stats = await traderStatsRepository.findByTraderId(traderId);
        // ... calculation logic ...
        // For now we'll just log
        logger.info(`Updating stats for trader ${traderId}`);
    } catch (e) {
        logger.error(`Error updating stats for trader ${traderId}:`, e);
    }
}
