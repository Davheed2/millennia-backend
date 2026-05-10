import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('payout_logs', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.timestamp('date').notNullable().defaultTo(knex.fn.now());
		table.string('type').notNullable(); // e.g. 'Global Daily', 'Manual Batch'
		table.decimal('amount', 14, 2).notNullable().defaultTo(0);
		table.integer('recipients').notNullable().defaultTo(0);
		table.enu('status', ['completed', 'failed']).notNullable().defaultTo('completed');
		table.text('error_message').nullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('payout_logs');
}
