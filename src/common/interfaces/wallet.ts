export interface IWallet {
	id: string;
	userId: string;
	balance: number;
    portfolioBalance: number;
    isSuspended: boolean;
    isDeleted: boolean;
	created_at?: Date;
	updated_at?: Date;
}
