import cron from 'node-cron';
import axios from 'axios';
import { ENVIRONMENT, knexDb } from '@/common/config';

const FINNHUB_API_KEY = ENVIRONMENT.FINNHUB_API_KEY;
const FMP_API_KEY = ENVIRONMENT.TWELVE_DATA_API_KEY;

const parsePercentage = (percentage: string) => {
	if (!percentage) return null;
	return parseFloat(percentage.replace('%', '')) / 100;
};

async function fetchAndUpdateAssets() {
	const assets = await knexDb('assets').select('*');

	for (const asset of assets) {
		try {
			const { symbol, type, id } = asset;

			if (type === 'stock') {
				const [quoteRes, metricRes] = await Promise.all([
					axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
					axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
				]);

				const quote = quoteRes.data;
				const metrics = metricRes.data.metric;

				await knexDb('asset_metrics')
					.insert({
						asset_id: id,
						price: quote.c,
						change_dollar: quote.d,
						change_percentage: quote.dp,
						volume: quote.v,
						market_cap: metrics.marketCapitalization,
						pe_ratio: metrics.peInclExtraTTM,
						dividend_yield: metrics.dividendYieldIndicatedAnnual,
						fifty_two_week_high: metrics['52WeekHigh'],
						fifty_two_week_low: metrics['52WeekLow'],
						created_at: new Date(),
						updated_at: new Date(),
					})
					.onConflict('asset_id')
					.merge({
						price: quote.c,
						change_dollar: quote.d,
						change_percentage: quote.dp,
						volume: quote.v,
						market_cap: metrics.marketCapitalization,
						pe_ratio: metrics.peInclExtraTTM,
						dividend_yield: metrics.dividendYieldIndicatedAnnual,
						fifty_two_week_high: metrics['52WeekHigh'],
						fifty_two_week_low: metrics['52WeekLow'],
						updated_at: new Date(),
					});
			}

			if (type === 'etf') {
				const [quoteRes, performanceRes] = await Promise.all([
					axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`),
					axios.get(`https://financialmodelingprep.com/api/v3/etf-sector-weightings/${symbol}?apikey=${FMP_API_KEY}`),
				]);

				const quote = quoteRes.data[0];
				const performance = performanceRes.data;

				console.log('quote', quote);
				console.log('performance', performance);

				const performance_ytd_value = parsePercentage(performance[0]?.weightPercentage);
				const performance_1y_value = parsePercentage(performance[1]?.weightPercentage);
				const performance_3y_value = parsePercentage(performance[2]?.weightPercentage);
				const performance_5y_value = parsePercentage(performance[3]?.weightPercentage);

				await knexDb('asset_metrics')
					.insert({
						asset_id: id,
						price: quote.price,
						change_dollar: quote.change,
						change_percentage: quote.changesPercentage,
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
						change_percentage: quote.changesPercentage,
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
