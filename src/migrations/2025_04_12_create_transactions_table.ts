import { TransactionStatus } from '../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('transactions', (table) => {
		table.uuid('id').primary().defaultTo(knex.fn.uuid());
		table.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
		table.integer('amount').notNullable();
		table.string('type').notNullable();
		table.string('description').notNullable();
		table.string('reference').notNullable();
		table.string('crypto').nullable();
		table.string('address').nullable();
		table.enum('status', Object.values(TransactionStatus)).notNullable().defaultTo(TransactionStatus.PENDING);
		table.string('paymentProof').nullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('transactions');
}
