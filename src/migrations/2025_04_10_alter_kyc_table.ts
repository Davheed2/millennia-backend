import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('kyc', (table) => {
		table.string('proofOfAddress').notNullable().defaultTo('');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('kyc', (table) => {
		table.dropColumn('proofOfAddress');
	});
}
