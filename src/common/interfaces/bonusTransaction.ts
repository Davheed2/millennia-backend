import { BonusType } from '../constants';

export interface IBonusTransaction {
	id: string;
	userId: string;
	referralId?: string;
	bonusType: BonusType;
	amount: number;
	isPaid: boolean;
	paidAt?: Date;
	notes?: string;
	created_at: Date;
	updated_at: Date;
}
