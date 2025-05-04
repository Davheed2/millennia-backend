import { ITransaction } from '@/common/interfaces';
import { AppError } from '@/common/utils';
import { transactionRepository } from '@/repository';

class TransactionService {
	async add(payload: Partial<ITransaction>): Promise<ITransaction[]> {
		const { userId, amount, type, description, status, reference } = payload;

		if (!userId || !amount || !type || !description || !status || !reference) {
			throw new AppError('Missing transaction data', 400);
		}

		const transaction = await transactionRepository.create({
			userId,
			amount,
			type,
			description,
			status,
			reference,
		});

		return transaction;
	}
}

export const Transaction = new TransactionService();
