import cron from 'node-cron';
import { runDailyInvestmentCron } from './investments';

// Schedule: Runs every 10 minutes (for demo)
cron.schedule('*/10 * * * *', async () => {
	console.log('Starting investment cron (every 10 mins)...');
	try {
		await runDailyInvestmentCron();
		console.log('Investment cron completed successfully.');
	} catch (error) {
		console.error('Investment cron failed:', error);
	}
});
// cron.schedule('0 0 * * *', async () => {