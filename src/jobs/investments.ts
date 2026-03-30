import { knexDb } from '@/common/config';
import { DateTime } from 'luxon';

const getFluctuatingProfit = (base: number, min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

export async function runDailyInvestmentCron() {
	console.log('Running investment cron...');

	// Reset dailyProfitChange for all users
	await knexDb('users').update({ dailyProfitChange: 0 });

	// Fetch all active investments
	const investments = await knexDb('investments').where({ isDeleted: false, isSwitchedOff: false });

	for (const investment of investments) {
		const { id, userId, plan, amount, percentageProfit, duration_days, matures_at } = investment;
		let profit = 0;

		if (duration_days && duration_days > 0 && matures_at) {
			// Duration-based investment: percentageProfit is the TOTAL return over the full duration
			const totalProfit = (Number(amount) * Number(percentageProfit)) / 100;
			const dailyProfit = totalProfit / Number(duration_days);

			const now = DateTime.now();
			const maturesAt = DateTime.fromJSDate(new Date(matures_at));

			if (now >= maturesAt) {
				// Investment has matured — credit full total profit and stop adding
				profit = dailyProfit;

				await knexDb.transaction(async (trx) => {
					try {
						await trx('users').where({ id: userId }).increment('dailyProfitChange', profit);
						await trx('users').where({ id: userId }).increment('totalProfit', profit);
						await trx('wallets').where({ userId }).increment('portfolioBalance', profit);
						await trx('investments').where({ id }).increment('dailyProfit', profit);
					} catch (err) {
						console.error(`Error in maturity transaction for user ${userId}:`, err);
						throw err;
					}
				});
				continue;
			}

			// Not yet matured — add daily share of profit
			profit = getFluctuatingProfit(dailyProfit, dailyProfit * 0.9, dailyProfit * 1.1);
		} else if (percentageProfit && percentageProfit > 0) {
			// Legacy: percentageProfit treated as daily percentage
			const dailyBase = Number(amount) * (Number(percentageProfit) / 100);
			profit = getFluctuatingProfit(dailyBase, dailyBase * 0.9, dailyBase * 1.1);
		} else {
			// Legacy plan-based fixed profits
			switch (plan) {
				case 'basic':
					profit = 148;
					break;
				case 'plus':
					profit = getFluctuatingProfit(443, 300, 450);
					break;
				case 'premium':
					profit = 1400;
					break;
				case 'gold':
					profit = getFluctuatingProfit(833, 700, 850);
					break;
				case 'platinum':
					profit = getFluctuatingProfit(2500, 2000, 2600);
					break;
				case 'diamond':
					profit = getFluctuatingProfit(5500, 5000, 5800);
					break;
				default:
					continue;
			}
		}

		await knexDb.transaction(async (trx) => {
			try {
				await trx('users').where({ id: userId }).increment('dailyProfitChange', profit);
				await trx('users').where({ id: userId }).increment('totalProfit', profit);
				await trx('wallets').where({ userId }).increment('portfolioBalance', profit);
				await trx('investments').where({ id }).increment('dailyProfit', profit);
			} catch (err) {
				console.error(`Error in transaction for user ${userId}:`, err);
				throw err;
			}
		});
	}

	console.log('Investment cron completed.');
}

runDailyInvestmentCron().catch((err) => {
	console.error('Cron job failed:', err);
});
