import { Request, Response } from 'express';
import { AppError, AppResponse, logger, referenceGenerator, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { investmentRepository, walletRepository } from '@/repository';
import { referralService, Transaction } from '@/services';
import { TransactionStatus } from '@/common/constants';

export class InvestmentController {
	create = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { isRetirement, plan, retirementAccountType, type, symbol, name, amount: reqAmount, percentageProfit } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (typeof isRetirement !== 'boolean') throw new AppError('isRetirement is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		const basicPlan = 3000;
		const basicPercentage = 5;
		const plusPlan = 7000;
		const plusPercentage = 6;
		const premiumPlan = 15000;
		const premiumPercentage = 9;
		const goldPlan = 10000;
		const goldPercentage = 8;
		const platinumPlan = 25000;
		const platinumPercentage = 10;
		const diamondPlan = 50000;
		const diamondPercentage = 11;

		let walletBalance = await walletRepository.findByUserId(user.id);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({
				userId: user.id,
			});
		}

		let amount = reqAmount || 0;
		let percentage = percentageProfit || 0;

		// If no specific amount/percentage provided, fallback to legacy plan names
		if (!reqAmount && !percentageProfit) {
			if (plan === 'basic') {
				amount = basicPlan;
				percentage = basicPercentage;
			} else if (plan === 'plus') {
				amount = plusPlan;
				percentage = plusPercentage;
			} else if (plan === 'premium') {
				amount = premiumPlan;
				percentage = premiumPercentage;
			} else if (plan === 'gold') {
				amount = goldPlan;
				percentage = goldPercentage;
			} else if (plan === 'platinum') {
				amount = platinumPlan;
				percentage = platinumPercentage;
			} else if (plan === 'diamond') {
				amount = diamondPlan;
				percentage = diamondPercentage;
			}
		}

		if (amount <= 0) throw new AppError('Invalid investment amount', 400);
		if (walletBalance[0].balance < amount) {
			throw new AppError('Insufficient Balance', 400);
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
			name,
			percentageProfit: percentage,
			dailyProfit: 0,
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
		} else {
			throw new AppError('Failed to create investment', 500);
		}

		AppResponse(res, 201, toJSON([investment]), 'Investment created successfully');

		setImmediate(async () => {
			try {
				const reference = referenceGenerator();
				await referralService.processReferralInvestment(user.id);

				await Transaction.add({
					userId: user.id,
					amount,
					type: 'Investment',
					description: `${plan} plan investment in ${symbol}`,
					reference,
					status: TransactionStatus.COMPLETED
				});
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
		if (!investmentId) new AppError('Investment ID is required', 400);

		const investment = await investmentRepository.findById(investmentId as string);
		if (!investment) {
			throw new AppError('No investement found', 404);
		}

		return AppResponse(res, 200, toJSON(investment), 'Investment fetched successfully');
	});
}

export const investmentController = new InvestmentController();
