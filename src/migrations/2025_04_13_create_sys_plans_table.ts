import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('sys_plan', (table) => {
		table.increments('id').primary();
		table.string('name').notNullable().unique();
		table.integer('price').notNullable();
		table.string('roi').notNullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('sys_plan');
}
