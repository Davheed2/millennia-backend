import { InvestmentType } from '../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('investments', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name').notNullable();
		table.integer('amount').notNullable();
		table.string('plan').notNullable();
		table.enum('type', Object.values(InvestmentType)).notNullable();
		table.string('symbol').notNullable();
		table.string('retirementAccountType').nullable();
		table.integer('dailyProfit').nullable();
		table.integer('initialAmount').notNullable();
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('SET NULL');
		table.boolean('isRetirement').notNullable().defaultTo(false);
		table.boolean('isSwitchedOff').notNullable().defaultTo(false);
		table.boolean('isDeleted').notNullable().defaultTo(false);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('investments');
}
