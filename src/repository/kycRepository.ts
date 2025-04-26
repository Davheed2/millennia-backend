import { knexDb } from '@/common/config';
import { IKyc } from '@/common/interfaces';
import { DateTime } from 'luxon';

class KycRepository {
	create = async (payload: Partial<IKyc>) => {
		return await knexDb.table('kyc').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IKyc | null> => {
		return await knexDb.table('kyc').where({ id }).first();
	};

	update = async (id: string, payload: Partial<IKyc>): Promise<IKyc[]> => {
		return await knexDb('kyc')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async (): Promise<IKyc[]> => {
		return await knexDb.table('kyc').orderBy('created_at', 'desc');
	};

	findByUserId = async (userId: string): Promise<IKyc> => {
		return await knexDb.table('kyc').where({ userId }).first();
	};

	delete = async (id: string): Promise<number> => {
		return await knexDb.table('kyc').where({ id }).del();
	};
}

export const kycRepository = new KycRepository();
