import { knexDb } from '@/common/config';
import { ITrader } from '@/common/interfaces';
import { DateTime } from 'luxon';

class TraderRepository {
	create = async (payload: Partial<ITrader>) => {
		return await knexDb.table('traders').insert(payload).returning('*');
	};

	findById = async (id: string) => {
		return await knexDb.table('traders').where({ id }).first();
	};

	findByUserId = async (userId: string) => {
		return await knexDb.table('traders').where({ userId }).first();
	};

	findAll = async (filters: { riskLevel?: string; assetFocus?: string; isActive?: boolean } = {}) => {
		const query = knexDb.table('traders').select('*');

		if (filters.riskLevel) query.where({ riskLevel: filters.riskLevel });
		if (filters.assetFocus) query.where({ assetFocus: filters.assetFocus });
		if (filters.isActive !== undefined) query.where({ isActive: filters.isActive });

		return await query.orderBy('totalProfitPercent', 'desc');
	};

	update = async (id: string, payload: Partial<ITrader>) => {
		return await knexDb('traders')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	incrementFollowers = async (id: string) => {
		return await knexDb('traders').where({ id }).increment('totalFollowers', 1);
	};

	decrementFollowers = async (id: string) => {
		return await knexDb('traders').where({ id }).decrement('totalFollowers', 1).where('totalFollowers', '>', 0);
	};
}

export const traderRepository = new TraderRepository();
