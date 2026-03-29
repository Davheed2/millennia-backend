import { knexDb } from '@/common/config';

// Sample fluctuating logic (you can replace with a better randomization logic or pricing service)
const getFluctuatingProfit = (base: number, min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

export async function runDailyInvestmentCron() {
	console.log('Running investment cron...');

	// Step 1: Reset dailyProfitChange for all users
	await knexDb('users').update({ dailyProfitChange: 0 });

	// Step 2: Fetch all investments
	const investments = await knexDb('investments').where({ isDeleted: false, isSwitchedOff: false });

	for (const investment of investments) {
		const { userId, plan, amount, percentageProfit } = investment;
		let profit = 0;

		if (percentageProfit && percentageProfit > 0) {
			const dailyBase = Number(amount) * (Number(percentageProfit) / 100);
			profit = getFluctuatingProfit(dailyBase, dailyBase * 0.9, dailyBase * 1.1);
		} else {
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

		// Step 3: Add profit to user's dailyProfitChange and wallet portfolioBalance
		await knexDb.transaction(async (trx) => {
			try {
				await trx('users').where({ id: userId }).increment('dailyProfitChange', profit);
				await trx('users').where({ id: userId }).increment('totalProfit', profit);
				await trx('wallets').where({ userId }).increment('portfolioBalance', profit);
				await trx('investments').where({ id: investment.id }).increment('dailyProfit', profit);
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
	//process.exit(1);
});
