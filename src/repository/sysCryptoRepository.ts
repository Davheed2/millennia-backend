import { knexDb } from '@/common/config';
import { DateTime } from 'luxon';

class SysCryptoRepository {
	async get() {
		return await knexDb.table('sys_crypto').first('*');
	}

	async getAll() {
		return await knexDb.table('sys_crypto').orderBy('created_at', 'asc');
	}

	async getById(id: number) {
		return await knexDb.table('sys_crypto').where('id', id).first();
	}

	async upsert(crypto: string, address: string) {
		const existing = await this.get();
		if (existing) {
			const [record] = await knexDb('sys_crypto')
				.where('id', existing.id)
				.update({ crypto, address, updated_at: DateTime.now().toJSDate() })
				.returning('*');
			return record;
		}
		const [record] = await knexDb('sys_crypto').insert({ crypto, address }).returning('*');
		return record;
	}

	async create(crypto: string, address: string) {
		const [record] = await knexDb('sys_crypto').insert({ crypto, address }).returning('*');
		return record;
	}

	async updateById(id: number, crypto: string, address: string) {
		const [record] = await knexDb('sys_crypto')
			.where('id', id)
			.update({ crypto, address, updated_at: DateTime.now().toJSDate() })
			.returning('*');
		return record;
	}

	async deleteById(id: number) {
		return await knexDb('sys_crypto').where('id', id).del();
	}
}

export const sysCryptoRepository = new SysCryptoRepository();
