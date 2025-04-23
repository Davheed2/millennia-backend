import { knexDb } from '@/common/config';
import { IReferral } from '@/common/interfaces';
import { DateTime } from 'luxon';

class ReferralRepository {
	create = async (payload: Partial<IReferral>) => {
		return await knexDb.table('referrals').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IReferral | null> => {
		return await knexDb.table('referrals').where({ id }).first();
	};

	findByReferrerId = async (referrerId: string): Promise<IReferral[]> => {
		return await knexDb.table('referrals').where({ referrerId }).orderBy('created_at', 'desc');
	};

	findByReferreeId = async (referreeId: string): Promise<IReferral | null> => {
		return await knexDb.table('referrals').where({ referreeId }).first();
	};

	findByReferreeInvestmentStatus = async (hasInvested: boolean): Promise<IReferral[]> => {
		return await knexDb.table('referrals').where({ hasInvested });
	};

	update = async (id: string, payload: Partial<IReferral>): Promise<IReferral[]> => {
		return await knexDb('referrals')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	countInvestedByReferrerId = async (referrerId: string): Promise<number> => {
		const result = (await knexDb
			.table('referrals')
			.where({ referrerId, hasInvested: true })
			.count('id as count')
			.first()) as unknown as { count: string };

		return parseInt(result?.count) || 0;
	};

	updateReferreeInvestmentStatus = async (referreeId: string, hasInvested: boolean): Promise<IReferral[]> => {
		return await knexDb('referrals')
			.where({ referreeId })
			.update({ hasInvested, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async (): Promise<IReferral[]> => {
		return await knexDb.table('referrals').orderBy('created_at', 'desc');
	};

	delete = async (id: string): Promise<number> => {
		return await knexDb.table('referrals').where({ id }).del();
	};
}

export const referralRepository = new ReferralRepository();
