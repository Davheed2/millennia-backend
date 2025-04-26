import { KycStatus } from '../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('kyc', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('SET NULL');
		table.string('name').notNullable();
		table.string('dob').notNullable();
		table.string('nationality').notNullable();
		table.string('address').notNullable();
		table.string('city').notNullable();
		table.string('postalCode').notNullable();
		table.string('documentType').notNullable();
		table.string('document').notNullable();
		table.string('selfie').notNullable();
		table.enum('status', Object.values(KycStatus)).defaultTo(KycStatus.PENDING);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('kyc');
}
