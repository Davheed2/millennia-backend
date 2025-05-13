import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('sys_phone', (table) => {
		table.increments('id').primary();
		table.string('phone').notNullable().unique();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('sys_phone');
}
