import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('investments', (table) => {
        table.decimal('amount', 15, 2).alter();
        table.decimal('initialAmount', 15, 2).alter();
        table.decimal('dailyProfit', 15, 2).alter();
        table.decimal('percentageProfit', 8, 2).alter();
    });

    await knex.schema.alterTable('wallets', (table) => {
        table.decimal('balance', 15, 2).alter();
        table.decimal('portfolioBalance', 15, 2).alter();
    });

    await knex.schema.alterTable('users', (table) => {
        table.decimal('dailyProfitChange', 15, 2).alter();
        table.decimal('totalProfit', 15, 2).alter();
    });

    await knex.schema.alterTable('transactions', (table) => {
        table.decimal('amount', 15, 2).alter();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('investments', (table) => {
        table.integer('amount').alter();
        table.integer('initialAmount').alter();
        table.integer('dailyProfit').alter();
        table.integer('percentageProfit').alter();
    });

    await knex.schema.alterTable('wallets', (table) => {
        table.integer('balance').alter();
        table.integer('portfolioBalance').alter();
    });

    await knex.schema.alterTable('users', (table) => {
        table.integer('dailyProfitChange').alter();
        table.integer('totalProfit').alter();
    });

    await knex.schema.alterTable('transactions', (table) => {
        table.integer('amount').alter();
    });
}
