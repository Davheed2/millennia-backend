import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tables = [
    'investments',
    'transactions',
    'live_trades',
    'user_bots',
    'copy_subscriptions',
    'follower_trades',
    'wallets'
  ];

  for (const tableName of tables) {
    const exists = await knex.schema.hasTable(tableName);
    if (exists) {
      await knex.schema.alterTable(tableName, (table) => {
        table.boolean('isDemo').notNullable().defaultTo(false);
      });
    }
  }

  // Update wallets unique constraint
  const walletsExists = await knex.schema.hasTable('wallets');
  if (walletsExists) {
    await knex.schema.alterTable('wallets', (table) => {
      // Drop the old constraint
      table.dropUnique(['userId']);
      // Add the new composite constraint
      table.unique(['userId', 'isDemo']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const walletsExists = await knex.schema.hasTable('wallets');
  if (walletsExists) {
    await knex.schema.alterTable('wallets', (table) => {
      table.dropUnique(['userId', 'isDemo']);
      table.unique(['userId']);
    });
  }

  const tables = [
    'investments',
    'transactions',
    'live_trades',
    'user_bots',
    'copy_subscriptions',
    'follower_trades',
    'wallets'
  ];

  for (const tableName of tables) {
    const exists = await knex.schema.hasTable(tableName);
    if (exists) {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropColumn('isDemo');
      });
    }
  }
}
