import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
	await knex('assets')
		.insert([
			{ symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
			{ symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
			{ symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
			{ symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock' },
			{ symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
			{ symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
			{ symbol: 'ROKU', name: 'Roku, Inc.', type: 'stock' },
			{ symbol: 'SNOW', name: 'Snowflake Inc.', type: 'stock' },
			{ symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'stock' },
			{ symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' },
			{ symbol: 'VTI', name: 'Vanguard Total Market ETF', type: 'etf' },
			{ symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf' },
			{ symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'etf' },
			{ symbol: 'BOTZ', name: 'Global X Robotics & AI', type: 'etf' },
			{ symbol: 'ICLN', name: 'iShares Global Clean Energy', type: 'etf' },
			{ symbol: 'VIG', name: 'Vanguard Dividend Appreciation', type: 'etf' },
			{ symbol: 'SCHD', name: 'Schwab U.S. Dividend Equity', type: 'etf' },
			{ symbol: 'DVY', name: 'iShares Select Dividend', type: 'etf' },
		])
		.onConflict('symbol')
		.ignore();
}
