import { knexDb } from '@/common/config';
import dayjs from 'dayjs';

export async function runDeleteReadMessagesCron() {
	console.log('Running deleteReadMessagesCron...');

	try {
		const thresholdDate = dayjs().subtract(24, 'hour').toDate();

		// Delete messages where readAt is older than 24 hours
		const deletedCount = await knexDb('messages').whereNotNull('readAt').andWhere('readAt', '<', thresholdDate).del();

		console.log(`✅ Deleted ${deletedCount} messages read more than 24 hours ago.`);
	} catch (error) {
		console.error('❌ Error during message cleanup cron:', error);
		process.exit(1);
	}
}

runDeleteReadMessagesCron();
