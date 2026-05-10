export enum TradeStatus {
	OPEN = 'open',
	CLOSED = 'closed',
	CANCELLED = 'cancelled',
}

export enum TradeDirection {
	BUY = 'buy',
	SELL = 'sell',
}

export enum SubscriptionStatus {
	ACTIVE = 'active',
	PAUSED = 'paused',
	STOPPED = 'stopped',
}

export enum AssetFocus {
	STOCKS = 'stocks',
	CRYPTO = 'crypto',
	BOTH = 'both',
}

export enum RiskLevel {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

export interface ITrader {
	id: string;
	userId: string;
	displayName: string;
	bio?: string;
	avatarUrl?: string;
	riskLevel: RiskLevel;
	assetFocus: AssetFocus;
	isActive: boolean;
	commissionRate: number;
	minCopyAmount: number;
	totalFollowers: number;
	winRate: number;
	totalProfitPercent: number;
	created_at?: Date;
	updated_at?: Date;
}

export interface ICopySubscription {
	id: string;
	followerId: string;
	traderId: string;
	allocatedAmount: number;
	copyRatio: number;
	maxLossPercent?: number;
	status: SubscriptionStatus;
	totalProfitLoss: number;
	isDemo?: boolean;
	created_at?: Date;
	updated_at?: Date;
}

export interface ITrade {
	id: string;
	traderId: string;
	assetType: 'stocks' | 'crypto';
	symbol: string;
	direction: TradeDirection;
	entryPrice: number;
	exitPrice?: number;
	size: number;
	leverage: number;
	status: TradeStatus;
	profitLoss?: number;
	profitLossPercent?: number;
	notes?: string;
	openedAt: Date;
	closedAt?: Date;
	created_at?: Date;
	updated_at?: Date;
}

export interface IFollowerTrade {
	id: string;
	masterTradeId: string;
	followerId: string;
	traderId: string;
	subscriptionId: string;
	symbol: string;
	direction: string;
	entryPrice: number;
	exitPrice?: number;
	allocatedAmount: number;
	size: number;
	status: 'open' | 'closed';
	profitLoss?: number;
	commissionPaid?: number;
	isDemo?: boolean;
	openedAt: Date;
	closedAt?: Date;
	created_at?: Date;
	updated_at?: Date;
}

export interface ITraderStats {
	id: string;
	traderId: string;
	totalTrades: number;
	winningTrades: number;
	losingTrades: number;
	totalProfitLoss: number;
	avgTradePercent: number;
	bestMonthPercent?: number;
	worstMonthPercent?: number;
	created_at?: Date;
	updated_at?: Date;
}
