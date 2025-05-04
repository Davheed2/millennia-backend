import { TransactionStatus } from '../constants';

export interface ITransaction {
	id: string;
	description: string;
	type: string;
	amount: string;
	status: TransactionStatus;
	userId: string;
	paymentProof: string | null;
	reference: string;
	crypto: string;
	address: string;
	created_at?: Date;
	updated_at?: Date;
}
