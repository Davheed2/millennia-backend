import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_bots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('botId').notNullable();
    table.string('name').notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('roi').notNullable();
    table.integer('duration_days').notNullable();
    table.string('status').notNullable().defaultTo('active'); // 'active', 'completed'
    table.timestamp('matures_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('live_trades', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('symbol').notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('orderType').notNullable(); // 'rise', 'fall'
    table.string('duration').notNullable(); // '1m', '5m', '15m', '1h'
    table.decimal('entryPrice', 14, 2).nullable();
    table.decimal('exitPrice', 14, 2).nullable();
    table.string('status').notNullable().defaultTo('open'); // 'open', 'won', 'lost'
    table.decimal('profit', 14, 2).defaultTo(0);
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('live_trades');
  await knex.schema.dropTableIfExists('user_bots');
}
