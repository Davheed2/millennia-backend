import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// 1. Traders table
	await knex.schema.createTable('traders', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
		table.string('displayName').notNullable();
		table.text('bio').nullable();
		table.string('avatarUrl').nullable();
		table.enu('riskLevel', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
		table.enu('assetFocus', ['stocks', 'crypto', 'both']).notNullable().defaultTo('both');
		table.boolean('isActive').notNullable().defaultTo(true);
		table.decimal('commissionRate', 5, 2).notNullable().defaultTo(10.00); // e.g. 10%
		table.decimal('minCopyAmount', 14, 2).notNullable().defaultTo(100.00);
		table.integer('totalFollowers').notNullable().defaultTo(0);
		table.decimal('winRate', 5, 2).notNullable().defaultTo(0.00);
		table.decimal('totalProfitPercent', 8, 2).notNullable().defaultTo(0.00);
		table.timestamps(true, true);
	});

	// 2. Copy Subscriptions table
	await knex.schema.createTable('copy_subscriptions', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('followerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('traderId').notNullable().references('id').inTable('traders').onDelete('CASCADE');
		table.decimal('allocatedAmount', 14, 2).notNullable();
		table.decimal('copyRatio', 5, 4).notNullable().defaultTo(1.0000); // 1.0 = 100%
		table.decimal('maxLossPercent', 5, 2).nullable();
		table.enu('status', ['active', 'paused', 'stopped']).notNullable().defaultTo('active');
		table.decimal('totalProfitLoss', 14, 2).notNullable().defaultTo(0.00);
		table.timestamps(true, true);
		table.unique(['followerId', 'traderId']);
	});

	// 3. Master Trades table
	await knex.schema.createTable('trades', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('traderId').notNullable().references('id').inTable('traders').onDelete('CASCADE');
		table.enu('assetType', ['stocks', 'crypto']).notNullable();
		table.string('symbol').notNullable();
		table.enu('direction', ['buy', 'sell']).notNullable();
		table.decimal('entryPrice', 14, 4).notNullable();
		table.decimal('exitPrice', 14, 4).nullable();
		table.decimal('size', 14, 4).notNullable(); // Position size in units or USD
		table.integer('leverage').notNullable().defaultTo(1);
		table.enu('status', ['open', 'closed', 'cancelled']).notNullable().defaultTo('open');
		table.decimal('profitLoss', 14, 4).nullable();
		table.decimal('profitLossPercent', 8, 4).nullable();
		table.text('notes').nullable();
		table.timestamp('openedAt').notNullable().defaultTo(knex.fn.now());
		table.timestamp('closedAt').nullable();
		table.timestamps(true, true);
	});

	// 4. Follower Trades table (Mirrored trades)
	await knex.schema.createTable('follower_trades', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('masterTradeId').notNullable().references('id').inTable('trades').onDelete('CASCADE');
		table.uuid('followerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('traderId').notNullable().references('id').inTable('traders').onDelete('CASCADE');
		table.uuid('subscriptionId').notNullable().references('id').inTable('copy_subscriptions').onDelete('CASCADE');
		table.string('symbol').notNullable();
		table.string('direction').notNullable();
		table.decimal('entryPrice', 14, 4).notNullable();
		table.decimal('exitPrice', 14, 4).nullable();
		table.decimal('allocatedAmount', 14, 2).notNullable(); // Proportional amount
		table.decimal('size', 14, 4).notNullable();
		table.enu('status', ['open', 'closed']).notNullable().defaultTo('open');
		table.decimal('profitLoss', 14, 4).nullable();
		table.decimal('commissionPaid', 14, 4).nullable();
		table.timestamp('openedAt').notNullable().defaultTo(knex.fn.now());
		table.timestamp('closedAt').nullable();
		table.timestamps(true, true);
	});

	// 5. Trader Stats table
	await knex.schema.createTable('trader_stats', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('traderId').notNullable().unique().references('id').inTable('traders').onDelete('CASCADE');
		table.integer('totalTrades').notNullable().defaultTo(0);
		table.integer('winningTrades').notNullable().defaultTo(0);
		table.integer('losingTrades').notNullable().defaultTo(0);
		table.decimal('totalProfitLoss', 14, 2).notNullable().defaultTo(0.00);
		table.decimal('avgTradePercent', 8, 4).notNullable().defaultTo(0.00);
		table.decimal('bestMonthPercent', 8, 4).nullable();
		table.decimal('worstMonthPercent', 8, 4).nullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('trader_stats');
	await knex.schema.dropTableIfExists('follower_trades');
	await knex.schema.dropTableIfExists('trades');
	await knex.schema.dropTableIfExists('copy_subscriptions');
	await knex.schema.dropTableIfExists('traders');
}
