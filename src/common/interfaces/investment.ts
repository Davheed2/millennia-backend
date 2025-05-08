import { InvestmentType } from '../constants';

export interface IInvestment {
	id: string;
	userId: string;
	name: string;
	type: InvestmentType;
	//percentageChange: string;   ///Either profit or loss percentage
	amount: number;
	initialAmount: number;
	dailyProfit: number;
	plan: string;
	retirementAccountType: string;
	symbol: string;
	isRetirement: boolean;
	isSwitchedOff: boolean;
    isDeleted: false;
	created_at?: Date;
	updated_at?: Date;
}
