import { Knex } from 'knex';

/**
 * Seed all 6 asset categories:
 * stock, etf (existing), crypto, energy, oil_gas, forex, commodity
 *
 * Run with: npx knex seed:run --specific=03_seed_new_assets.ts
 */
export async function seed(knex: Knex): Promise<void> {
	await knex('assets')
		.insert([
			// ─── CRYPTO ─────────────────────────────────────────────────────
			{ symbol: 'BTC', name: 'Bitcoin', type: 'crypto', sector: 'layer1' },
			{ symbol: 'ETH', name: 'Ethereum', type: 'crypto', sector: 'layer1' },
			{ symbol: 'SOL', name: 'Solana', type: 'crypto', sector: 'layer1' },
			{ symbol: 'BNB', name: 'Binance Coin', type: 'crypto', sector: 'exchange' },
			{ symbol: 'XRP', name: 'XRP', type: 'crypto', sector: 'payments' },
			{ symbol: 'ADA', name: 'Cardano', type: 'crypto', sector: 'layer1' },
			{ symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', sector: 'meme' },
			{ symbol: 'AVAX', name: 'Avalanche', type: 'crypto', sector: 'layer1' },
			{ symbol: 'DOT', name: 'Polkadot', type: 'crypto', sector: 'layer0' },
			{ symbol: 'LINK', name: 'Chainlink', type: 'crypto', sector: 'oracle' },

			// ─── ENERGY ─────────────────────────────────────────────────────
			// Using ETF proxies for energy sectors (free Finnhub stock quotes)
			{ symbol: 'XLE', name: 'Energy Select Sector ETF', type: 'energy', sector: 'broad_energy' },
			{ symbol: 'ICLN', name: 'iShares Global Clean Energy ETF', type: 'energy', sector: 'clean_energy' },
			{ symbol: 'FSLR', name: 'First Solar Inc.', type: 'energy', sector: 'solar' },
			{ symbol: 'ENPH', name: 'Enphase Energy Inc.', type: 'energy', sector: 'solar' },
			{ symbol: 'NEE', name: 'NextEra Energy Inc.', type: 'energy', sector: 'renewable' },
			{ symbol: 'UNG', name: 'US Natural Gas Fund ETF', type: 'energy', sector: 'natural_gas' },

			// ─── OIL & GAS ──────────────────────────────────────────────────
			{ symbol: 'USO', name: 'US Oil Fund ETF (WTI Crude)', type: 'oil_gas', sector: 'crude_oil' },
			{ symbol: 'BNO', name: 'US Brent Oil Fund ETF', type: 'oil_gas', sector: 'crude_oil' },
			{ symbol: 'XOM', name: 'ExxonMobil Corporation', type: 'oil_gas', sector: 'integrated' },
			{ symbol: 'CVX', name: 'Chevron Corporation', type: 'oil_gas', sector: 'integrated' },
			{ symbol: 'COP', name: 'ConocoPhillips', type: 'oil_gas', sector: 'upstream' },
			{ symbol: 'SLB', name: 'Schlumberger (SLB)', type: 'oil_gas', sector: 'services' },

			// ─── FOREX ──────────────────────────────────────────────────────
			// Symbols use Finnhub OANDA format: "OANDA:EUR_USD"
			{ symbol: 'OANDA:EUR_USD', name: 'Euro / US Dollar', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:GBP_USD', name: 'British Pound / US Dollar', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:USD_JPY', name: 'US Dollar / Japanese Yen', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:AUD_USD', name: 'Australian Dollar / US Dollar', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:USD_CHF', name: 'US Dollar / Swiss Franc', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:USD_CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:NZD_USD', name: 'New Zealand Dollar / US Dollar', type: 'forex', sector: 'major' },
			{ symbol: 'OANDA:EUR_GBP', name: 'Euro / British Pound', type: 'forex', sector: 'cross' },

			// ─── COMMODITIES (Gold & Silver) ─────────────────────────────────
			{ symbol: 'OANDA:XAU_USD', name: 'Gold / US Dollar', type: 'commodity', sector: 'precious_metals' },
			{ symbol: 'OANDA:XAG_USD', name: 'Silver / US Dollar', type: 'commodity', sector: 'precious_metals' },
			{ symbol: 'OANDA:XPT_USD', name: 'Platinum / US Dollar', type: 'commodity', sector: 'precious_metals' },
			// ETF proxies for easy stock-API fetching
			{ symbol: 'GLD', name: 'SPDR Gold Shares ETF', type: 'commodity', sector: 'precious_metals' },
			{ symbol: 'SLV', name: 'iShares Silver Trust ETF', type: 'commodity', sector: 'precious_metals' },
		])
		.onConflict('symbol')
		.ignore();
}
