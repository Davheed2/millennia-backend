import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('assets')
		.where('symbol', 'ABPL')
		.update({
			symbol: 'OANDA:XPT_USD',
			name: 'Platinum / US Dollar',
			sector: 'precious_metals'
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex('assets')
		.where('symbol', 'OANDA:XPT_USD')
		.update({
			symbol: 'ABPL',
			name: 'Alajo BPL',
			sector: null
		});
}
