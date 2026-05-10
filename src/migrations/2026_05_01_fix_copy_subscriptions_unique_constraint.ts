import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const exists = await knex.schema.hasTable('copy_subscriptions');
	if (!exists) return;

	await knex.schema.alterTable('copy_subscriptions', (table) => {
		// Drop the old constraint that only covered (followerId, traderId)
		table.dropUnique(['followerId', 'traderId']);
		// Add the new composite constraint that includes isDemo, allowing
		// a user to have both a real AND a demo subscription to the same trader
		table.unique(['followerId', 'traderId', 'isDemo']);
	});
}

export async function down(knex: Knex): Promise<void> {
	const exists = await knex.schema.hasTable('copy_subscriptions');
	if (!exists) return;

	await knex.schema.alterTable('copy_subscriptions', (table) => {
		table.dropUnique(['followerId', 'traderId', 'isDemo']);
		table.unique(['followerId', 'traderId']);
	});
}
