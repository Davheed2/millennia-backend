import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('referrals', (table) => {
		table.string('referreeEmail').notNullable().defaultTo('');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('referrals', (table) => {
		table.dropColumn('referreeEmail');
	});
}
