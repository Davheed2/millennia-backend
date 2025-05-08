import { Request, Response } from 'express';
import { AppError, AppResponse, logger, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { investmentRepository, walletRepository } from '@/repository';
import { referralService } from '@/services';

export class InvestmentController {
	create = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { isRetirement, plan, retirementAccountType, type, symbol, name } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (typeof isRetirement !== 'boolean') throw new AppError('isRetirement is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		const basicPlan = 3000;
		const plusPlan = 7000;
		const premiumPlan = 15000;
		let walletBalance = await walletRepository.findByUserId(user.id);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({
				userId: user.id,
			});
		}

		let amount = 0;
		if (plan === 'basic') {
			amount = basicPlan;
			if (walletBalance[0].balance < basicPlan) {
				throw new AppError('Insufficient Balance', 400);
			}
		}
		if (plan === 'plus') {
			amount = plusPlan;
			if (walletBalance[0].balance < plusPlan) {
				throw new AppError('Insufficient Balance', 400);
			}
		}
		if (plan === 'premium') {
			amount = premiumPlan;
			if (walletBalance[0].balance < premiumPlan) {
				throw new AppError('Insufficient Balance', 400);
			}
		}

		const [investment] = await investmentRepository.create({
			userId: user.id,
			isRetirement,
			plan,
			type,
			symbol,
			retirementAccountType,
			amount,
			initialAmount: amount,
			name
		});
		if (investment) {
			const updatedWallet = await walletRepository.update(walletBalance[0].id, {
				balance: walletBalance[0].balance - amount,
			});

			const portfolio = await walletRepository.update(walletBalance[0].id, {
				portfolioBalance: walletBalance[0].portfolioBalance + amount,
			});

			if (!updatedWallet || !portfolio) {
				throw new AppError('Failed to update wallet or portfolio balance', 500);
			}
		}
		if (!investment) {
			throw new AppError('Failed to create investement', 500);
		}

		AppResponse(res, 201, toJSON([investment]), 'Investment created successfully');

		setImmediate(async () => {
			try {
				await referralService.processReferralInvestment(user.id);
			} catch (error) {
				logger.error(error);
			}
		});
	});

	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 400);

		const investment = await investmentRepository.findByUserId(user.id);
		if (!investment) {
			throw new AppError('No investement found', 404);
		}

		return AppResponse(res, 200, toJSON(investment), 'Investments fetched successfully');
	});

	findById = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { investmentId } = req.query;

		if (!user) throw new AppError('Please log in again', 400);

		const investment = await investmentRepository.findById(investmentId as string);
		if (!investment) {
			throw new AppError('No investement found', 404);
		}

		return AppResponse(res, 200, toJSON(investment), 'Investment fetched successfully');
	});
}

export const investmentController = new InvestmentController();
