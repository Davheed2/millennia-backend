import { knexDb } from '@/common/config';
import { ILiveTrade } from '@/common/interfaces';

class LiveTradeRepository {
  create = async (payload: Partial<ILiveTrade>) => {
    return await knexDb.table('live_trades').insert(payload).returning('*');
  };

  findByUserId = async (userId: string, isDemo: boolean = false) => {
    return await knexDb.table('live_trades').where({ userId, isDemo }).orderBy('created_at', 'desc');
  };

  update = async (id: string, payload: Partial<ILiveTrade>) => {
    return await knexDb.table('live_trades').where({ id }).update(payload).returning('*');
  };

  findOpenExpired = async () => {
    const now = new Date();
    return await knexDb.table('live_trades')
      .where('status', 'open')
      .andWhere('expires_at', '<=', now);
  };
}

export const liveTradeRepository = new LiveTradeRepository();
