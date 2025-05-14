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

export enum MessageStatus {
	SENT = 'sent',
	DELIVERED = 'delivered',
	READ = 'read',
}

export enum SocketEvents {
	// Connection events
	CONNECT = 'connect',
	DISCONNECT = 'disconnect',

	// Authentication events
	AUTH_ERROR = 'auth_error',

	// Presence events
	USER_ONLINE = 'user_online',
	USER_OFFLINE = 'user_offline',
	USER_TYPING = 'user_typing',
	USER_STOP_TYPING = 'user_stop_typing',
	ONLINE_USERS = 'online_users',

	// Message events
	SEND_MESSAGE = 'send_message',
	MESSAGE_RECEIVED = 'message_received',
	MESSAGE_READ = 'message_read',
	GET_MESSAGES = 'get_messages'
}
