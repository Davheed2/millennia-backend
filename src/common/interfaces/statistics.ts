export interface Statistics {
	totalUsers: number;
	totalInvestments: number;
	totalDeposits: number;
	totalWithdrawals: number;
	totalKyc: number;
}

export interface UserStatistics {
	totalInvested: number;
	totalProfit: number;
	activeInvestments: number;
	completedInvestments: number;
	roi: number;
	totalDeposits: number;
	totalWithdrawals: number;
	pendingDeposits: number;
	pendingWithdrawals: number;
}