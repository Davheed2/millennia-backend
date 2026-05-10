export type AssetType = 'stock' | 'etf' | 'crypto' | 'energy' | 'oil_gas' | 'forex' | 'commodity';

export interface IAsset {
	id: string;
	symbol: string;
	name: string;
	type: AssetType;
	sector?: string;
	created_at?: Date;
	updated_at?: Date;
}

export interface IAssetMetrics {
	id: string;
	asset_id: string;
	price: number;
	change_percentage: number;
	change_dollar: number;
	volume: number;
	market_cap: number;
	pe_ratio?: number;
	dividend_yield: number;
	fifty_two_week_high: number;
	fifty_two_week_low: number;
	net_assets?: number;
	expense_ratio?: number;
	yield?: number;
	inception_date?: Date;
	performance_ytd?: number;
	performance_1y?: number;
	performance_3y?: number;
	performance_5y?: number;
	created_at?: Date;
	updated_at?: Date;
}

export type IAssetWithMetrics = IAsset & IAssetMetrics;
