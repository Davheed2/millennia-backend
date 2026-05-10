import { knexDb } from '@/common/config';
import { ITraderStats } from '@/common/interfaces';
import { DateTime } from 'luxon';

class TraderStatsRepository {
	create = async (payload: Partial<ITraderStats>) => {
		return await knexDb.table('trader_stats').insert(payload).returning('*');
	};

	findByTraderId = async (traderId: string) => {
		return await knexDb.table('trader_stats').where({ traderId }).first();
	};

	update = async (traderId: string, payload: Partial<ITraderStats>) => {
		return await knexDb('trader_stats')
			.where({ traderId })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	getLeaderboard = async (limit: number = 20) => {
		return await knexDb('trader_stats')
			.join('traders', 'trader_stats.traderId', '=', 'traders.id')
			.select(
				'traders.id',
				'traders.displayName',
				'traders.avatarUrl',
				'traders.riskLevel',
				'traders.totalProfitPercent',
				'traders.winRate',
				'trader_stats.totalTrades',
				'trader_stats.totalProfitLoss'
			)
			.orderBy('traders.totalProfitPercent', 'desc')
			.limit(limit);
	};
}

export const traderStatsRepository = new TraderStatsRepository();
