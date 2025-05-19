import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('referrals', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('referrerId').notNullable();
		table.string('referreeId').notNullable().unique();
		table.string('referreeFirstName').notNullable();
		table.string('referreeLastName').notNullable();
		table.string('hasInvested').defaultTo(false);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('referrals');
}
