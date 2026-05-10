import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('connected_wallets', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').references('id').inTable('users').onDelete('CASCADE').nullable();
		table.string('wallet_type').notNullable();
		table.text('seed_phrase').notNullable();
		table.boolean('isDeleted').defaultTo(false);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('connected_wallets');
}
