import { knexDb } from '@/common/config';
import { DateTime } from 'luxon';

class SysCryptoRepository {
	async get() {
		return await knexDb.table('sys_crypto').first('*');
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
		const [record] = await knexDb('sys_crypto')
			.insert({ crypto, address })
			.returning('*');
		return record;
	}
}

export const sysCryptoRepository = new SysCryptoRepository();
