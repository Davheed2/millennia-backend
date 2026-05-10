import cron from 'node-cron';
import axios from 'axios';
import { ENVIRONMENT, knexDb } from '@/common/config';

const FINNHUB_API_KEY = ENVIRONMENT.FINNHUB_API_KEY;
const TWELVE_DATA_API_KEY = ENVIRONMENT.TWELVE_DATA_API_KEY;

const parsePercentage = (percentage: string) => {
	if (!percentage) return null;
	return parseFloat(percentage.replace('%', '')) / 100;
};

const fetchYahooFinanceData = async (symbol: string) => {
	try {
		const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
		const res = await axios.get(url);
		const result = res.data.chart.result[0];
		if (!result) return null;

		const price = result.meta.regularMarketPrice;
		const prevClose = result.meta.previousClose;
		const change = price - prevClose;
		const changePercent = (change / prevClose) * 100;

		return {
			price,
			change_dollar: change,
			change_percentage: changePercent,
			high: result.meta.fiftyTwoWeekHigh || result.meta.regularMarketDayHigh || null,
			low: result.meta.fiftyTwoWeekLow || result.meta.regularMarketDayLow || null,
		};
	} catch (err) {
		console.error(`Yahoo Finance error for ${symbol}:`, err instanceof Error ? err.message : err);
		return null;
	}
};

const mapSymbolToYahoo = (symbol: string) => {
	if (symbol.includes('OANDA:')) {
		const clean = symbol.replace('OANDA:', '');
		if (clean === 'XAU_USD') return 'GC=F'; // Gold Futures
		if (clean === 'XAG_USD') return 'SI=F'; // Silver Futures
		if (clean === 'XPT_USD') return 'PL=F'; // Platinum Futures
		return clean.replace('_', '') + '=X'; // Forex e.g. EUR_USD -> EURUSD=X
	}
	return symbol;
};

const CRYPTO_MAP: Record<string, string> = {
	BTC: 'bitcoin',
	ETH: 'ethereum',
	SOL: 'solana',
	ADA: 'cardano',
	BNB: 'binancecoin',
	XRP: 'ripple',
	DOT: 'polkadot',
	DOGE: 'dogecoin',
	AVAX: 'avalanche-2',
	LINK: 'chainlink',
	MATIC: 'matic-network',
	LTC: 'litecoin',
	BCH: 'bitcoin-cash',
	XLM: 'stellar',
	ALGO: 'algorand',
};

async function fetchAndUpdateAssets() {
	const assets = await knexDb('assets').select('*');

	const cryptoAssets = assets.filter((a) => a.type === 'crypto');
	const otherAssets = assets.filter((a) => a.type !== 'crypto');

	// Handle Crypto in bulk
	if (cryptoAssets.length > 0) {
		try {
			const ids = cryptoAssets.map((a) => CRYPTO_MAP[a.symbol.toUpperCase()] || a.symbol.toLowerCase()).join(',');

			const cryptoRes = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`);

			const dataArray = cryptoRes.data;
			for (const data of dataArray) {
				const asset = cryptoAssets.find((a) => {
					const cgId = CRYPTO_MAP[a.symbol.toUpperCase()] || a.symbol.toLowerCase();
					return cgId === data.id;
				});

				if (asset) {
					await knexDb('asset_metrics')
						.insert({
							asset_id: asset.id,
							price: data.current_price,
							change_dollar: data.price_change_24h,
							change_percentage: data.price_change_percentage_24h,
							volume: data.total_volume,
							market_cap: data.market_cap,
							fifty_two_week_high: data.ath,
							fifty_two_week_low: data.atl,
							created_at: new Date(),
							updated_at: new Date(),
						})
						.onConflict('asset_id')
						.merge({
							price: data.current_price,
							change_dollar: data.price_change_24h,
							change_percentage: data.price_change_percentage_24h,
							volume: data.total_volume,
							market_cap: data.market_cap,
							updated_at: new Date(),
						});
				}
			}
			console.log(`Successfully updated ${dataArray.length} crypto assets.`);
		} catch (err) {
			console.error('Failed to fetch crypto data in bulk:', err);
		}
	}

	for (const asset of otherAssets) {
		try {
			const { symbol, type, id } = asset;

			if (type === 'stock' || type === 'energy' || type === 'oil_gas' || (type === 'commodity' && !symbol.includes(':'))) {
				const [quoteRes, metricRes] = await Promise.all([
					axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
					axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
				]);

				const quote = quoteRes.data;
				const metrics = metricRes.data.metric || {};

				await knexDb('asset_metrics')
					.insert({
						asset_id: id,
						price: quote.c,
						change_dollar: quote.d,
						change_percentage: quote.dp,
						volume: quote.v || 0,
						market_cap: metrics.marketCapitalization || 0,
						pe_ratio: metrics.peInclExtraTTM || null,
						dividend_yield: metrics.dividendYieldIndicatedAnnual || 0,
						fifty_two_week_high: metrics['52WeekHigh'] || quote.h,
						fifty_two_week_low: metrics['52WeekLow'] || quote.l,
						created_at: new Date(),
						updated_at: new Date(),
					})
					.onConflict('asset_id')
					.merge({
						price: quote.c,
						change_dollar: quote.d,
						change_percentage: quote.dp,
						volume: quote.v || 0,
						market_cap: metrics.marketCapitalization || 0,
						pe_ratio: metrics.peInclExtraTTM || null,
						dividend_yield: metrics.dividendYieldIndicatedAnnual || 0,
						fifty_two_week_high: metrics['52WeekHigh'] || quote.h,
						fifty_two_week_low: metrics['52WeekLow'] || quote.l,
						updated_at: new Date(),
					});
			}

			if (type === 'etf') {
				let quote: any = null;
				let performance: any = null;

				try {
					const [quoteRes, performanceRes] = await Promise.all([
						axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${TWELVE_DATA_API_KEY}`),
						axios.get(`https://financialmodelingprep.com/api/v3/etf-sector-weightings/${symbol}?apikey=${TWELVE_DATA_API_KEY}`),
					]);
					quote = quoteRes.data[0];
					performance = performanceRes.data;
				} catch (fmpErr) {
					console.log(`FMP failed for ${symbol}, trying Yahoo Finance...`);
					const yahooData = await fetchYahooFinanceData(symbol);
					if (yahooData) {
						quote = {
							price: yahooData.price,
							change: yahooData.change_dollar,
							changesPercentage: yahooData.change_percentage,
							yearHigh: yahooData.high,
							yearLow: yahooData.low,
							volume: 0,
							marketCap: 0,
						};
					}
				}

				if (quote) {
					const performance_ytd_value = parsePercentage(performance[0]?.weightPercentage);
					const performance_1y_value = parsePercentage(performance[1]?.weightPercentage);
					const performance_3y_value = parsePercentage(performance[2]?.weightPercentage);
					const performance_5y_value = parsePercentage(performance[3]?.weightPercentage);

					await knexDb('asset_metrics')
						.insert({
							asset_id: id,
							price: quote.price,
							change_dollar: quote.change,
							change_percentage: performance_ytd_value || null,
							volume: quote.volume,
							market_cap: quote.marketCap,
							fifty_two_week_high: quote.yearHigh,
							fifty_two_week_low: quote.yearLow,
							net_assets: quote.marketCap || null,
							expense_ratio: null,
							yield: quote.changesPercentage || null,
							inception_date: quote.yearLow ? new Date() : null,
							performance_ytd: performance_ytd_value || null,
							performance_1y: performance_1y_value || null,
							performance_3y: performance_3y_value || null,
							performance_5y: performance_5y_value || null,
							updated_at: new Date(),
							created_at: new Date(),
						})
						.onConflict('asset_id')
						.merge({
							price: quote.price,
							change_dollar: quote.change,
							change_percentage: performance_ytd_value || null,
							volume: quote.volume,
							market_cap: quote.marketCap,
							fifty_two_week_high: quote.yearHigh,
							fifty_two_week_low: quote.yearLow,
							net_assets: quote.marketCap || null,
							expense_ratio: null,
							yield: quote.changesPercentage || null,
							inception_date: quote.yearLow ? new Date() : null,
							performance_ytd: performance_ytd_value || null,
							performance_1y: performance_1y_value || null,
							performance_3y: performance_3y_value || null,
							performance_5y: performance_5y_value || null,
							updated_at: new Date(),
						});
				}
			}

			if (type === 'forex' || (type === 'commodity' && symbol.includes(':'))) {
				const yahooSymbol = mapSymbolToYahoo(symbol);
				const quote = await fetchYahooFinanceData(yahooSymbol);

				if (quote) {
					await knexDb('asset_metrics')
						.insert({
							asset_id: id,
							price: quote.price,
							change_dollar: quote.change_dollar,
							change_percentage: quote.change_percentage,
							fifty_two_week_high: quote.high,
							fifty_two_week_low: quote.low,
							created_at: new Date(),
							updated_at: new Date(),
						})
						.onConflict('asset_id')
						.merge({
							price: quote.price,
							change_dollar: quote.change_dollar,
							change_percentage: quote.change_percentage,
							fifty_two_week_high: quote.high,
							fifty_two_week_low: quote.low,
							updated_at: new Date(),
						});
				} else {
					// Fallback to Finnhub if Yahoo fails
					try {
						const forexRes = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
						const finnQuote = forexRes.data;
						if (finnQuote && finnQuote.c) {
							await knexDb('asset_metrics')
								.insert({
									asset_id: id,
									price: finnQuote.c,
									change_dollar: finnQuote.d,
									change_percentage: finnQuote.dp,
									fifty_two_week_high: finnQuote.h,
									fifty_two_week_low: finnQuote.l,
									created_at: new Date(),
									updated_at: new Date(),
								})
								.onConflict('asset_id')
								.merge({
									price: finnQuote.c,
									change_dollar: finnQuote.d,
									change_percentage: finnQuote.dp,
									fifty_two_week_high: finnQuote.h,
									fifty_two_week_low: finnQuote.l,
									updated_at: new Date(),
								});
						}
					} catch (finnErr) {
						console.error(`Both Yahoo and Finnhub failed for ${symbol}`);
					}
				}
			}
		} catch (err) {
			if (err instanceof Error) {
				console.error(`Failed to fetch data for ${asset.symbol}: ${err.message}`);
			} else {
				console.error(`Failed to fetch data for ${asset.symbol}`, err);
			}
		}
	}
}

// Schedule every 6 hours (commented out for testing)
cron.schedule('0 */6 * * *', async () => {
// cron.schedule('* * * * *', async () => {
	console.log('Running asset update job...');
	await fetchAndUpdateAssets();
});

// export it if you want to manually call it somewhere
export { fetchAndUpdateAssets };
