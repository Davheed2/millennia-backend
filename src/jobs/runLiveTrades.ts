import cron from 'node-cron';
import { settleExpiredTrades } from './liveTrades';

// Run every 20 seconds to ensure quick feedback for 1m trades
cron.schedule('*/20 * * * * *', async () => {
  try {
    await settleExpiredTrades();
  } catch (error) {
    console.error('Live trade cron failed:', error);
  }
});

console.log('Live trade settlement job scheduled (every 10s)');
