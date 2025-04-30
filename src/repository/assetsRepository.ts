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
}

export const assetsRepository = new AssetsRepository();
