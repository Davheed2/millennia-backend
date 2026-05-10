import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('sys_plan', (table) => {
		table.integer('duration_days').notNullable().defaultTo(1);
		table.decimal('min_amount', 15, 2).nullable();
		table.decimal('max_amount', 15, 2).nullable();
		table.boolean('is_active').notNullable().defaultTo(true);
	});

	await knex.schema.alterTable('investments', (table) => {
		table.integer('duration_days').nullable();
		table.timestamp('matures_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('sys_plan', (table) => {
		table.dropColumn('duration_days');
		table.dropColumn('min_amount');
		table.dropColumn('max_amount');
		table.dropColumn('is_active');
	});

	await knex.schema.alterTable('investments', (table) => {
		table.dropColumn('duration_days');
		table.dropColumn('matures_at');
	});
}
