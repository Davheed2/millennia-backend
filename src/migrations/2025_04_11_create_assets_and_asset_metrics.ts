import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('symbol').notNullable().unique();
    table.string('name').notNullable();
    table.enu('type', ['stock', 'etf']).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('asset_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('asset_id').references('id').inTable('assets').onDelete('CASCADE').notNullable();
    
    // Common fields
    table.decimal('price', 14, 4);
    table.decimal('change_percentage', 7, 4);
    table.decimal('change_dollar', 14, 4);
    table.bigInteger('volume');
    table.decimal('market_cap', 20, 4);
    table.decimal('pe_ratio', 10, 4).nullable(); // null for ETFs
    table.decimal('dividend_yield', 7, 4);
    table.decimal('fifty_two_week_high', 14, 4);
    table.decimal('fifty_two_week_low', 14, 4);

    // ETF specific fields
    table.decimal('net_assets', 20, 4).nullable();
    table.decimal('expense_ratio', 7, 4).nullable();
    table.decimal('yield', 7, 4).nullable();
    table.date('inception_date').nullable();
    
    table.decimal('performance_ytd', 7, 4).nullable();
    table.decimal('performance_1y', 7, 4).nullable();
    table.decimal('performance_3y', 7, 4).nullable();
    table.decimal('performance_5y', 7, 4).nullable();
    
    table.timestamps(true, true);

    table.unique(['asset_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('asset_metrics');
  await knex.schema.dropTableIfExists('assets');
}
