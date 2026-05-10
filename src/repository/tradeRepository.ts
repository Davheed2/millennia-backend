import { knexDb } from '@/common/config';
import { ITrade } from '@/common/interfaces';
import { DateTime } from 'luxon';

class TradeRepository {
	create = async (payload: Partial<ITrade>) => {
		return await knexDb.table('trades').insert(payload).returning('*');
	};

	findById = async (id: string) => {
		return await knexDb.table('trades').where({ id }).first();
	};

	findOpenTradesByTrader = async (traderId: string) => {
		return await knexDb.table('trades').where({ traderId, status: 'open' });
	};

	findTradesHistoryByTrader = async (traderId: string) => {
		return await knexDb.table('trades')
			.where({ traderId })
			.whereIn('status', ['closed', 'cancelled'])
			.orderBy('closedAt', 'desc');
	};

	update = async (id: string, payload: Partial<ITrade>) => {
		return await knexDb('trades')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};
}

export const tradeRepository = new TradeRepository();
