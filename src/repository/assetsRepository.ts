import { knexDb } from '@/common/config';

class AssetsRepository {
	getAllStocks = async () => {
		try {
			const stocks = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.price',
					'asset_metrics.change_dollar',
					'asset_metrics.change_percentage',
					'asset_metrics.volume',
					'asset_metrics.market_cap',
					'asset_metrics.pe_ratio',
					'asset_metrics.dividend_yield',
					'asset_metrics.fifty_two_week_high',
					'asset_metrics.fifty_two_week_low'
				)
				.where('assets.type', 'stock');
			return stocks;
		} catch (err) {
			console.error('Error fetching all stocks:', err);
			throw new Error('Could not fetch stock data.');
		}
	};

	getStockById = async (assetId: string) => {
		try {
			const stock = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.price',
					'asset_metrics.change_dollar',
					'asset_metrics.change_percentage',
					'asset_metrics.volume',
					'asset_metrics.market_cap',
					'asset_metrics.pe_ratio',
					'asset_metrics.dividend_yield',
					'asset_metrics.fifty_two_week_high',
					'asset_metrics.fifty_two_week_low'
				)
				.where('asset_metrics.asset_id', assetId)
				.where('assets.type', 'stock')
				.first(); // To get a single stock based on the ID

			return stock;
		} catch (err) {
			console.error(`Error fetching stock by ID (${assetId}):`, err);
			throw new Error(`Could not fetch stock with ID ${assetId}`);
		}
	};

	//
	getStockBySymbol = async (symbol: string) => {
		try {
			const stock = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.price',
					'asset_metrics.change_dollar',
					'asset_metrics.change_percentage',
					'asset_metrics.volume',
					'asset_metrics.market_cap',
					'asset_metrics.pe_ratio',
					'asset_metrics.dividend_yield',
					'asset_metrics.fifty_two_week_high',
					'asset_metrics.fifty_two_week_low'
				)
				.where('assets.symbol', symbol)
				.where('assets.type', 'stock')
				.first(); // To get a single stock by symbol

			return stock;
		} catch (err) {
			console.error(`Error fetching stock by symbol (${symbol}):`, err);
			throw new Error(`Could not fetch stock with symbol ${symbol}`);
		}
	};

	// export async function getAllETFs() {
	getAllETFs = async () => {
		try {
			const etfs = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.net_assets',
					'asset_metrics.expense_ratio',
					'asset_metrics.yield',
					'asset_metrics.inception_date',
					'asset_metrics.performance_ytd',
					'asset_metrics.performance_1y',
					'asset_metrics.performance_3y',
					'asset_metrics.performance_5y'
				)
				.where('assets.type', 'etf');
			return etfs;
		} catch (err) {
			console.error('Error fetching all ETFs:', err);
			throw new Error('Could not fetch ETF data.');
		}
	};

	getETFById = async (assetId: string) => {
		try {
			const etf = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.net_assets',
					'asset_metrics.expense_ratio',
					'asset_metrics.yield',
					'asset_metrics.inception_date',
					'asset_metrics.performance_ytd',
					'asset_metrics.performance_1y',
					'asset_metrics.performance_3y',
					'asset_metrics.performance_5y'
				)
				.where('asset_metrics.asset_id', assetId)
				.where('assets.type', 'etf')
				.first(); // To get a single ETF based on the ID

			return etf;
		} catch (err) {
			console.error(`Error fetching ETF by ID (${assetId}):`, err);
			throw new Error(`Could not fetch ETF with ID ${assetId}`);
		}
	};

	findBySymbol = async (symbol: string) => {
		return await knexDb.table('assets').where({ symbol }).first();
	};

	getETFBySymbol = async (symbol: string) => {
		try {
			const etf = await knexDb('asset_metrics')
				.join('assets', 'asset_metrics.asset_id', '=', 'assets.id')
				.select(
					'asset_metrics.asset_id',
					'assets.symbol',
					'assets.name',
					'asset_metrics.net_assets',
					'asset_metrics.expense_ratio',
					'asset_metrics.yield',
					'asset_metrics.inception_date',
					'asset_metrics.performance_ytd',
					'asset_metrics.performance_1y',
					'asset_metrics.performance_3y',
					'asset_metrics.performance_5y'
				)
				.where('assets.symbol', symbol)
				.where('assets.type', 'etf')
				.first(); // To get a single ETF by symbol

			return etf;
		} catch (err) {
			console.error(`Error fetching ETF by symbol (${symbol}):`, err);
			throw new Error(`Could not fetch ETF with symbol ${symbol}`);
		}
	};

	getByTypeQuery = (type: string) => {
		return knexDb('assets')
			.leftJoin('asset_metrics', 'asset_metrics.asset_id', '=', 'assets.id')
			.select(
				'assets.id',
				'assets.symbol',
				'assets.name',
				'assets.type',
				'assets.sector',
				'asset_metrics.price',
				'asset_metrics.change_dollar',
				'asset_metrics.change_percentage',
				'asset_metrics.volume',
				'asset_metrics.market_cap',
				'asset_metrics.pe_ratio',
				'asset_metrics.dividend_yield',
				'asset_metrics.fifty_two_week_high',
				'asset_metrics.fifty_two_week_low',
				'asset_metrics.net_assets',
				'asset_metrics.expense_ratio',
				'asset_metrics.yield',
				'asset_metrics.inception_date',
				'asset_metrics.performance_ytd',
				'asset_metrics.performance_1y',
				'asset_metrics.performance_3y',
				'asset_metrics.performance_5y'
			)
			.where('assets.type', type);
	};

	getByType = async (type: string) => {
		try {
			return await this.getByTypeQuery(type);
		} catch (err) {
			console.error(`Error fetching assets for type (${type}):`, err);
			throw new Error(`Could not fetch data for assets of type ${type}`);
		}
	};

	getMarketSummary = async () => {
		try {
			const categories = await knexDb('assets')
				.leftJoin('asset_metrics', 'assets.id', 'asset_metrics.asset_id')
				.select('assets.type')
				.avg('asset_metrics.change_percentage as performance')
				.groupBy('assets.type');

			const tickerSymbols = ['BTC', 'ETH', 'OANDA:XAU_USD', 'SPY', 'GLD'];
			const tickers = await knexDb('assets')
				.join('asset_metrics', 'assets.id', 'asset_metrics.asset_id')
				.select(
					'assets.symbol',
					'assets.name',
					'asset_metrics.price',
					'asset_metrics.change_percentage',
					'asset_metrics.change_dollar'
				)
				.whereIn('assets.symbol', tickerSymbols);

			return { categories, tickers };
		} catch (err) {
			console.error('Error fetching market summary:', err);
			throw new Error('Could not fetch market summary data.');
		}
	};
}

export const assetsRepository = new AssetsRepository();
