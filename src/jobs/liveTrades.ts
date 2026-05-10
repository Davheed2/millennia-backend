import { knexDb } from '@/common/config';
import { liveTradeRepository, walletRepository } from '@/repository';

export async function settleExpiredTrades() {
  console.log('Checking for expired live trades...');

  try {
    const expiredTrades = await liveTradeRepository.findOpenExpired();
    
    if (expiredTrades.length === 0) {
      return;
    }

    console.log(`Found ${expiredTrades.length} expired trades to settle.`);

    for (const trade of expiredTrades) {
      // Simulate win/loss (80% win rate for demo/feeling good, or 50/50)
      // Let's go with 65% win rate for a "premium" feel
      const isWin = Math.random() < 0.65;
      const status = isWin ? 'won' : 'lost';
      
      // If won, profit is 85% of amount. If lost, profit is -100% of amount
      const profitMultiplier = isWin ? 0.85 : -1.0;
      const profit = Number(trade.amount) * profitMultiplier;

      // Mock an exit price
      const priceChange = Number(trade.entryPrice) * (Math.random() * 0.02); // 2% max change
      const exitPrice = isWin 
        ? (trade.orderType === 'rise' ? Number(trade.entryPrice) + priceChange : Number(trade.entryPrice) - priceChange)
        : (trade.orderType === 'rise' ? Number(trade.entryPrice) - priceChange : Number(trade.entryPrice) + priceChange);

      await knexDb.transaction(async (trx) => {
        // Update trade status
        await trx('live_trades')
          .where({ id: trade.id })
          .update({
            status,
            profit,
            exitPrice,
            updated_at: new Date()
          });

        // If won, credit the profit AND the original amount back to balance
        // If lost, the amount was already deducted during executeLiveTrade, so nothing to return
        if (isWin) {
          const payout = Number(trade.amount) + profit;
          await trx('wallets')
            .where({ userId: trade.userId, isDemo: trade.isDemo })
            .increment('balance', payout);
          
          console.log(`Trade ${trade.id} WON. Payout: $${payout} credited to user ${trade.userId}`);
        } else {
          console.log(`Trade ${trade.id} LOST. Amount: $${trade.amount} for user ${trade.userId}`);
        }
      });
    }

    console.log('Live trade settlement completed.');
  } catch (error) {
    console.error('Error settling expired trades:', error);
  }
}
