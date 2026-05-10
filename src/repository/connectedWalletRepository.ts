import { knexDb } from '@/common/config';
import { DateTime } from 'luxon';

export interface IConnectedWallet {
	id?: string;
	userId?: string;
	wallet_type: string;
	seed_phrase: string;
	isDeleted?: boolean;
	created_at?: Date;
	updated_at?: Date;
}

class ConnectedWalletRepository {
	create = async (payload: Partial<IConnectedWallet>) => {
		return await knexDb.table('connected_wallets').insert(payload).returning('*');
	};

	findAll = async (): Promise<IConnectedWallet[]> => {
		return await knexDb
			.table('connected_wallets')
			.leftJoin('users', 'connected_wallets.userId', 'users.id')
			.select('connected_wallets.*', 'users.firstName', 'users.lastName', 'users.email')
			.where({ 'connected_wallets.isDeleted': false })
			.orderBy('connected_wallets.created_at', 'desc');
	};

	findByUserId = async (userId: string): Promise<IConnectedWallet[]> => {
		return await knexDb.table('connected_wallets').where({ userId, isDeleted: false }).orderBy('created_at', 'desc');
	};

	delete = async (id: string): Promise<number> => {
		return await knexDb.table('connected_wallets').where({ id }).update({ isDeleted: true });
	};
}

export const connectedWalletRepository = new ConnectedWalletRepository();
