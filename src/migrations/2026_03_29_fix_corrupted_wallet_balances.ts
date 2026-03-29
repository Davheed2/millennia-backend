import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Fix corrupted wallet balances (values like "123.456.789" or non-numeric)
	// Set to 0 for records with invalid balance format
	await knex.raw(`
        UPDATE wallets 
        SET balance = 0, 
            updated_at = NOW()
        WHERE balance::text ~ '[a-zA-Z]' 
           OR balance::text ~ '\\..*\\.'  -- contains multiple decimals (e.g., "197842.00100.00")
    `);

	// Ensure all wallet balances are valid numbers (cast to decimal)
	await knex.raw(`
        UPDATE wallets 
        SET balance = CAST(balance AS DECIMAL(15,2)),
            portfolioBalance = CAST(COALESCE(portfolioBalance, 0) AS DECIMAL(15,2)),
            updated_at = NOW()
        WHERE balance IS NOT NULL 
          AND portfolioBalance IS NOT NULL
    `);

	// Recalculate wallet balances from actual transaction history
	// This is a more accurate fix - calculate balance from deposit/withdrawal/transfer transactions

	// First, fix the balance by summing completed deposits minus withdrawals/transfers/investments
	await knex.raw(`
        UPDATE wallets w
        SET balance = COALESCE((
            SELECT 
                COALESCE(SUM(CASE WHEN type IN ('deposit', 'Deposit', 'profit', 'Profit') AND status = 'completed' THEN amount ELSE 0 END), 0)
                -
                COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'withdrawal', 'investment', 'Investment', 'transfer', 'Transfer') AND status = 'completed' THEN amount ELSE 0 END), 0)
            FROM transactions t
            WHERE t."userId" = w."userId"
        ), 0),
        updated_at = NOW()
    `);
}

export async function down(knex: Knex): Promise<void> {
	// This migration is a data fix, no rollback needed
	// The down function is kept for knex consistency
	console.log('No rollback available for data fix migration');
}
