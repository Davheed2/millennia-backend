import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Check if portfoliobalance column exists using raw query
	const result = await knex.raw(`
		SELECT column_name FROM information_schema.columns 
		WHERE table_name = 'wallets' AND column_name = 'portfoliobalance'
	`);

	const hasPortfolioBalance = result.rows && result.rows.length > 0;

	if (!hasPortfolioBalance) {
		await knex.schema.alterTable('wallets', (table) => {
			table.decimal('portfoliobalance', 15, 2).defaultTo(0);
		});
	}

	// Fix corrupted wallet balances (values like "123.456.789" or non-numeric)
	await knex.raw(
		`UPDATE wallets SET balance = 0, updated_at = NOW() WHERE balance::text ~ '[a-zA-Z]' OR balance::text ~ '\..*\.'`
	);

	// Ensure all wallet balances are valid decimal numbers
	await knex.raw(`UPDATE wallets SET balance = 0 WHERE balance IS NULL`);
	await knex.raw(`UPDATE wallets SET balance = ROUND(CAST(balance AS NUMERIC), 2)`);

	// Update portfoliobalance
	await knex.raw(`UPDATE wallets SET portfoliobalance = 0 WHERE portfoliobalance IS NULL`);
	await knex.raw(`UPDATE wallets SET portfoliobalance = ROUND(CAST(COALESCE(portfoliobalance, 0) AS NUMERIC), 2)`);

	// Recalculate from transactions and investments
	await knex.raw(`
		UPDATE wallets w
		SET 
			balance = COALESCE((
				SELECT 
					COALESCE(SUM(CASE WHEN type IN ('deposit', 'Deposit', 'profit', 'Profit') AND status = 'completed' THEN CAST(amount AS NUMERIC) ELSE 0 END), 0)
					-
					COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'investment', 'Investment', 'transfer', 'Transfer') AND status = 'completed' THEN CAST(amount AS NUMERIC) ELSE 0 END), 0)
				FROM transactions t
				WHERE t."userId" = w."userId"
			), 0),
			portfoliobalance = COALESCE((
				SELECT SUM(CAST(amount AS NUMERIC))
				FROM investments i
				WHERE i."userId" = w."userId" AND i."isDeleted" = false
			), 0),
			updated_at = NOW()
	`);
}

export async function down(knex: Knex): Promise<void> {
	console.log('No rollback for data fix migration');
}
