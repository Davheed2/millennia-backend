import { knexDb } from '@/common/config';
import { IBonusTransaction } from '@/common/interfaces';
import { DateTime } from 'luxon';

class BonusTransactionRepository {
	create = async (
		payload: Omit<IBonusTransaction, 'id' | 'created_at' | 'updated_at' | 'isPaid' | 'paidAt'>
	): Promise<IBonusTransaction[]> => {
		return await knexDb
			.table('bonus_transactions')
			.insert({
				...payload,
				isPaid: false,
			})
			.returning('*');
	};

	findById = async (id: string): Promise<IBonusTransaction | null> => {
		return await knexDb.table('bonus_transactions').where({ id }).first();
	};

	findByUserId = async (userId: string): Promise<IBonusTransaction[]> => {
		return await knexDb.table('bonus_transactions').where({ userId }).orderBy('created_at', 'desc');
	};

	findByReferralId = async (referralId: string): Promise<IBonusTransaction[]> => {
		return await knexDb.table('bonus_transactions').where({ referralId }).orderBy('created_at', 'desc');
	};

	findUnpaidBonuses = async (): Promise<IBonusTransaction[]> => {
		return await knexDb.table('bonus_transactions').where({ isPaid: false }).orderBy('created_at', 'asc');
	};

	markAsPaid = async (id: string): Promise<IBonusTransaction[]> => {
		return await knexDb('bonus_transactions')
			.where({ id })
			.update({
				isPaid: true,
				paidAt: DateTime.now().toJSDate(),
				updated_at: DateTime.now().toJSDate(),
			})
			.returning('*');
	};

	sumUserBonuses = async (userId: string): Promise<number> => {
		const result = (await knexDb.table('bonus_transactions').where({ userId }).sum('amount as total').first()) as
			| { total: string | number }
			| undefined;

		return result ? parseFloat(result.total.toString()) : 0;
	};

	sumUserPaidBonuses = async (userId: string): Promise<number> => {
		const result = (await knexDb
			.table('bonus_transactions')
			.where({ userId, isPaid: true })
			.sum('amount as total')
			.first()) as { total: string | number } | undefined;

		return result ? parseFloat(result.total.toString()) : 0;
	};

	sumUserUnpaidBonuses = async (userId: string): Promise<number> => {
		const result = (await knexDb
			.table('bonus_transactions')
			.where({ userId, isPaid: false })
			.sum('amount as total')
			.first()) as { total: string | number } | undefined;

		return result ? parseFloat(result.total.toString()) : 0;
	};
}

export const bonusTransactionRepository = new BonusTransactionRepository();
