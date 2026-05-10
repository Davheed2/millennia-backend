import { knexDb } from '@/common/config';
import { IPlan } from '@/common/interfaces';
import { DateTime } from 'luxon';

class PlanRepository {
	findAll = async (): Promise<IPlan[]> => {
		return await knexDb.table('sys_plan').orderBy('price', 'asc');
	};

	findAllActive = async (): Promise<IPlan[]> => {
		return await knexDb.table('sys_plan').where({ is_active: true }).orderBy('price', 'asc');
	};

	findById = async (id: number): Promise<IPlan | undefined> => {
		return await knexDb.table('sys_plan').where({ id }).first();
	};

	findByName = async (name: string): Promise<IPlan | undefined> => {
		return await knexDb.table('sys_plan').where({ name }).first();
	};

	create = async (payload: Partial<IPlan>): Promise<IPlan[]> => {
		return await knexDb.table('sys_plan').insert(payload).returning('*');
	};

	update = async (id: number, payload: Partial<IPlan>): Promise<IPlan[]> => {
		return await knexDb('sys_plan')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	delete = async (id: number): Promise<number> => {
		return await knexDb('sys_plan').where({ id }).delete();
	};
}

export const planRepository = new PlanRepository();
