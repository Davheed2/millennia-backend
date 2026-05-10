import { knexDb } from '@/common/config';
import { IFollowerTrade } from '@/common/interfaces';
import { DateTime } from 'luxon';

class FollowerTradeRepository {
	create = async (payload: Partial<IFollowerTrade>) => {
		return await knexDb.table('follower_trades').insert(payload).returning('*');
	};

	findById = async (id: string) => {
		return await knexDb.table('follower_trades').where({ id }).first();
	};

	findOpenTradesByFollower = async (followerId: string, isDemo: boolean = false) => {
		return await knexDb.table('follower_trades')
            .join('traders', 'follower_trades.traderId', '=', 'traders.id')
            .where({ 'follower_trades.followerId': followerId, 'follower_trades.status': 'open', 'follower_trades.isDemo': isDemo });
	};

    findHistoryByFollower = async (followerId: string, isDemo: boolean = false) => {
		return await knexDb.table('follower_trades')
            .join('traders', 'follower_trades.traderId', '=', 'traders.id')
            .where({ 'follower_trades.followerId': followerId, 'follower_trades.status': 'closed', 'follower_trades.isDemo': isDemo })
            .orderBy('closedAt', 'desc');
	};

	findOpenTradesByMasterTrade = async (masterTradeId: string) => {
		return await knexDb.table('follower_trades').where({ masterTradeId, status: 'open' });
	};

	update = async (id: string, payload: Partial<IFollowerTrade>) => {
		return await knexDb('follower_trades')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};
}

export const followerTradeRepository = new FollowerTradeRepository();
