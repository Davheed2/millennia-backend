import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('bonus_transactions', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().index();
		table.uuid('referralId').nullable().index();
		table.enum('bonusType', ['REFERRAL_BONUS', 'REFEREE_BONUS', 'MILESTONE_BONUS']).notNullable();
		table.decimal('amount', 10, 2).notNullable();
		table.boolean('isPaid').defaultTo(false);
		table.timestamp('paidAt').nullable();
		table.string('notes').nullable();
		table.timestamps(true, true);

		// Foreign keys
		table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
		table.foreign('referralId').references('id').inTable('referrals').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('bonus_transactions');
}
