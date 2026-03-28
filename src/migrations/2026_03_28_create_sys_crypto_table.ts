import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('sys_crypto', (table) => {
		table.increments('id').primary();
		table.string('crypto').notNullable().defaultTo('BTC');
		table.string('address').notNullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('sys_crypto');
}
