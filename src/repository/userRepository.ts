import { knexDb } from '@/common/config';
import { IUser, Statistics } from '@/common/interfaces';
import { DateTime } from 'luxon';

class UserRepository {
	create = async (payload: Partial<IUser>) => {
		return await knexDb.table('users').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ id }).first();
	};

	findByEmail = async (email: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ email }).first();
	};

	findByUsername = async (username: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ username }).first();
	};

	findByEmailOrPhone = async (email: string, phone: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ email }).orWhere({ phone }).first();
	};

	findByPasswordResetToken = async (passwordResetToken: string): Promise<IUser | null> => {
		return await knexDb
			.table('users')
			.where({ passwordResetToken })
			.where('passwordResetExpires', '>', DateTime.now().toJSDate())
			.where({ isSuspended: false })
			.first();
	};

	findByReferralCode = async (referralCode: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ referralCode }).first();
	};

	incrementReferralCredits = async (userId: string, amount: number): Promise<IUser[]> => {
		// First, get the current referralCredits value
		const user = await this.findById(userId);

		if (!user) {
			throw new Error('User not found');
		}

		// Calculate the new referralCredits value
		const currentCredits = user.referralCredits || 0;
		const newCredits = currentCredits + amount;

		// Update the user with the new referralCredits value
		return await knexDb('users')
			.where({ id: userId })
			.update({
				referralCredits: newCredits,
				updated_at: DateTime.now().toJSDate(),
			})
			.returning('*');
	};

	findByVerificationToken = async (verificationToken: string): Promise<IUser | null> => {
		return await knexDb
			.table('users')
			.where({ verificationToken })
			.where('verificationTokenExpires', '>', DateTime.now().toJSDate())
			.first();
	};

	update = async (id: string, payload: Partial<IUser>): Promise<IUser[]> => {
		return await knexDb('users')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async () => {
		return await knexDb.table('users').orderBy('created_at', 'desc');
	};

	findByRole = async (role: string) => {
		return await knexDb.table('users').where({ role });
	};

	findByIsSuspended = async (isSuspended: boolean) => {
		return await knexDb.table('users').where({ isSuspended });
	};

	findByIsDeleted = async (isDeleted: boolean) => {
		return await knexDb.table('users').where({ isDeleted });
	};

	updateCompanyPhone = async (id: number, payload: Partial<IUser>): Promise<IUser[]> => {
		return await knexDb('sys_phone')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	getCompanyPhone = async () => {
		return await knexDb.table('sys_phone').orderBy('created_at', 'desc');
	};

	findStats = async (): Promise<Statistics> => {
		const totalUsers = await knexDb('users').where({ isDeleted: false }).count('* as count').first();
		const totalInvestments = await knexDb('investments').where({ isDeleted: false }).count('* as count').first();
		const totalKyc = await knexDb('kyc').count('* as count').first();
		const totalDeposits = await knexDb('transactions')
			.where({ type: 'Deposit' })
			.whereIn('status', ['completed'])
			.sum('amount as total')
			.first();
		const totalWithdrawals = await knexDb('transactions')
			.where({ type: 'withdrawal' })
			.whereIn('status', ['completed'])
			.sum('amount as total')
			.first();

		return {
			totalUsers: Number(totalUsers?.count) || 0,
			totalInvestments: Number(totalInvestments?.count) || 0,
			totalDeposits: Number(totalDeposits?.total) || 0,
			totalWithdrawals: Number(totalWithdrawals?.total) || 0,
			totalKyc: Number(totalKyc?.count) || 0,
		};
	};

	findAllAdmins = async (): Promise<IUser[]> => {
		return knexDb('users').where('role', 'admin').andWhere('isDeleted', false);
	};
}

export const userRepository = new UserRepository();
