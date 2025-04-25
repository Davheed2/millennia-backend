import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('referrals', (table) => {
		table.boolean('hasInvested').notNullable().defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('referrals', (table) => {
		table.dropColumn('hasInvested');
	});
}
