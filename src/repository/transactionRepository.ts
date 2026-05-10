import { knexDb } from '@/common/config';
import { ITransaction } from '@/common/interfaces';
import { DateTime } from 'luxon';

class TransactionRepository {
	create = async (payload: Partial<ITransaction>) => {
		return await knexDb.table('transactions').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<ITransaction | null> => {
		return await knexDb.table('transactions').where({ id }).first();
	};

	findByUserId = async (userId: string, isDemo: boolean = false): Promise<ITransaction[]> => {
		return await knexDb.table('transactions').where({ userId, isDemo }).orderBy('created_at', 'desc');
	};

	update = async (id: string, payload: Partial<ITransaction>): Promise<ITransaction[]> => {
		return await knexDb('transactions')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findDepositsQuery = () => {
		return knexDb('transactions')
			.where({ type: 'Deposit' })
			.orderBy('transactions.created_at', 'desc')
			.join('users', 'transactions.userId', 'users.id')
			.select('transactions.*', 'users.firstName', 'users.lastName');
	};

	findDeposits = async () => {
		return await this.findDepositsQuery();
	};

	findWithdrawalsQuery = () => {
		return knexDb('transactions')
			.where({ type: 'withdrawal' })
			.orderBy('transactions.created_at', 'desc')
			.join('users', 'transactions.userId', 'users.id')
			.select('transactions.*', 'users.firstName', 'users.lastName');
	};

	findWithdrawals = async () => {
		return await this.findWithdrawalsQuery();
	};
}

export const transactionRepository = new TransactionRepository();
