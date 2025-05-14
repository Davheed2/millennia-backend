import { MessageStatus } from '../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('messages', (table) => {
		table.increments('id').primary();
		table.uuid('senderId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('recipientId').nullable().references('id').inTable('users').onDelete('CASCADE');
		table.text('content').notNullable();
		table.enum('status', Object.values(MessageStatus)).defaultTo(MessageStatus.SENT);
		table.jsonb('attachments').defaultTo('[]');
		table.timestamp('readAt');
		table.timestamps(true, true);

		// Indexes
		table.index('senderId');
		table.index('recipientId');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('messages');
}
