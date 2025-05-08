/**
 * App wide constants go here
 *
 * e.g
 * export const APP_NAME = 'MyApp';
 */
export enum Role {
	SuperUser = 'superuser',
	User = 'user',
	Admin = 'admin',
}

export enum BonusType {
	REFERRAL_BONUS = 'REFERRAL_BONUS',
	REFEREE_BONUS = 'REFEREE_BONUS',
	MILESTONE_BONUS = 'MILESTONE_BONUS',
}

export enum KycStatus {
	PENDING = 'pending',
	APPROVED = 'approved',
	REJECTED = 'rejected',
}

export enum TransactionStatus {
	COMPLETED = 'completed',
	PENDING = 'pending',
	FAILED = 'failed',
}

export enum InvestmentType {
	STOCKS = 'stocks',
	RETIREMENT = 'retirement',
	CRYPTO = 'crypto',
	ETFS = 'etfs',
}
