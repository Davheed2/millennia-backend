import cron from 'node-cron';
import { runDailyInvestmentCron } from './investments';

// Schedule: Runs every day at 00:00 (midnight)
// cron.schedule('0 0 * * *', async () => {
cron.schedule('* * * * *', async () => {
	console.log('Starting daily investment cron...');
	try {
		await runDailyInvestmentCron();
		console.log('Daily investment cron completed successfully.');
	} catch (error) {
		console.error('Daily investment cron failed:', error);
	}
});
