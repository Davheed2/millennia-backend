import { knexDb } from '@/common/config';
import { IUserBot } from '@/common/interfaces';

class UserBotRepository {
  create = async (payload: Partial<IUserBot>) => {
    return await knexDb.table('user_bots').insert(payload).returning('*');
  };

  findByUserId = async (userId: string, isDemo: boolean = false) => {
    return await knexDb.table('user_bots').where({ userId, isDemo }).orderBy('created_at', 'desc');
  };
}

export const userBotRepository = new UserBotRepository();
