import cron from 'node-cron';
import { runDeleteReadMessagesCron } from './messages';

// Schedule: Runs every 12 hours (00:00 and 12:00)
cron.schedule('0 */12 * * *', async () => {
	console.log('Starting message deletion cron...');
	try {
		await runDeleteReadMessagesCron();
		console.log('Message deletion cron completed successfully.');
	} catch (error) {
		console.error('Message deletion cron failed:', error);
	}
});
