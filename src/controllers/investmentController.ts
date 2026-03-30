import { Request, Response } from 'express';
import { AppError, AppResponse, logger, referenceGenerator, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { investmentRepository, planRepository, walletRepository } from '@/repository';
import { referralService, Transaction } from '@/services';
import { TransactionStatus } from '@/common/constants';
import { DateTime } from 'luxon';

function getDurationForPercentage(percentage: number): number {
	if (percentage >= 12) return 5;
	if (percentage >= 7) return 3;
	return 2;
}

function resolvePercentageAndDuration(plan: string, isRetirement: boolean, reqPercentage?: number, reqAmount?: number) {
	let percentage = reqPercentage || 0;
	let amount = reqAmount || 0;

	if (!reqPercentage && !reqAmount) {
		const planLower = plan.toLowerCase();
		if (
			planLower.includes('basic') ||
			planLower.includes('starter') ||
			planLower.includes('foundation') ||
			planLower.includes('entry')
		) {
			amount = isRetirement ? 5000 : 350;
			percentage = 5.2;
		} else if (
			planLower.includes('plus') ||
			planLower.includes('explore') ||
			planLower.includes('satellite') ||
			planLower.includes('basket') ||
			planLower.includes('ladder') ||
			planLower.includes('diversified portfolio') ||
			planLower.includes('farm index')
		) {
			amount = isRetirement ? 10000 : 1000;
			percentage = 7.8;
		} else if (
			planLower.includes('premium') ||
			planLower.includes('gold') ||
			planLower.includes('platinum') ||
			planLower.includes('diamond') ||
			planLower.includes('secure') ||
			planLower.includes('income') ||
			planLower.includes('futures') ||
			planLower.includes('barbell') ||
			planLower.includes('ownership') ||
			planLower.includes('farmland')
		) {
			amount = isRetirement ? 25000 : 5000;
			percentage = 12.4;
		} else if (planLower.includes('trial')) {
			amount = 100;
			percentage = 5.2;
		}
	}

	if (percentage === 0) {
		const planLower = plan.toLowerCase();
		if (
			planLower.includes('starter') ||
			planLower.includes('foundation') ||
			planLower.includes('entry') ||
			planLower.includes('trial')
		)
			percentage = 5.2;
		else if (
			planLower.includes('explore') ||
			planLower.includes('satellite') ||
			planLower.includes('basket') ||
			planLower.includes('ladder') ||
			planLower.includes('diversified portfolio') ||
			planLower.includes('farm index')
		)
			percentage = 7.8;
		else if (
			planLower.includes('secure') ||
			planLower.includes('income') ||
			planLower.includes('futures') ||
			planLower.includes('barbell') ||
			planLower.includes('ownership') ||
			planLower.includes('farmland')
		)
			percentage = 12.4;
	}

	return { percentage, amount };
}

export class InvestmentController {
	confirm = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { plan, isRetirement, type, symbol, name, amount: reqAmount, percentageProfit } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (typeof isRetirement !== 'boolean') throw new AppError('isRetirement is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		let walletBalance = await walletRepository.findByUserId(user.id);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({ userId: user.id });
		}

		const sysPlan = await planRepository.findByName(plan);
		const { percentage, amount } = resolvePercentageAndDuration(plan, isRetirement, percentageProfit, reqAmount);

		if (amount <= 0) throw new AppError('Invalid investment amount', 400);

		const durationDays = sysPlan?.duration_days || getDurationForPercentage(percentage);
		const expectedProfit = Number(((amount * percentage) / 100).toFixed(2));
		const expectedTotal = Number((amount + expectedProfit).toFixed(2));

		return AppResponse(
			res,
			200,
			toJSON([
				{
					plan,
					amount,
					percentageProfit: percentage,
					duration_days: durationDays,
					expectedProfit,
					expectedTotal,
					symbol,
					name,
					type,
					isRetirement,
					retirementAccountType: req.body.retirementAccountType || null,
					walletBalance: Number(walletBalance[0].balance),
					canAfford: Number(walletBalance[0].balance) >= amount,
				},
			]),
			'Investment confirmation details'
		);
	});

	create = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const {
			isRetirement,
			plan,
			retirementAccountType,
			type,
			symbol,
			name,
			amount: reqAmount,
			percentageProfit,
		} = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (typeof isRetirement !== 'boolean') throw new AppError('isRetirement is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		const sysPlan = await planRepository.findByName(plan);

		let walletBalance = await walletRepository.findByUserId(user.id);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({ userId: user.id });
		}

		const { percentage, amount } = resolvePercentageAndDuration(plan, isRetirement, percentageProfit, reqAmount);

		if (amount <= 0) throw new AppError('Invalid investment amount', 400);
		if (walletBalance[0].balance < amount) {
			throw new AppError('Insufficient Balance', 400);
		}

		const durationDays = sysPlan?.duration_days || getDurationForPercentage(percentage);
		const maturesAt = DateTime.now().plus({ days: durationDays }).toJSDate();

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
			duration_days: durationDays,
			matures_at: maturesAt,
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
					status: TransactionStatus.COMPLETED,
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

	withdrawProfit = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { investmentId } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!investmentId) throw new AppError('Investment ID is required', 400);

		const investment = await investmentRepository.findOneById(investmentId);
		if (!investment || investment.userId !== user.id) {
			throw new AppError('Investment not found', 404);
		}

		const profit = Number(investment.dailyProfit) || 0;
		if (profit <= 0) throw new AppError('No profit to withdraw', 400);

		const walletArr = await walletRepository.findByUserId(user.id);
		const userWallet = walletArr[0];

		await walletRepository.update(userWallet.id, {
			balance: Number(userWallet.balance) + profit,
		});

		await investmentRepository.update(investmentId, {
			dailyProfit: 0,
		});

		await Transaction.add({
			userId: user.id,
			amount: profit,
			type: 'Profit',
			description: `Profit withdrawal from ${investment.name}`,
			reference: referenceGenerator(),
			status: TransactionStatus.COMPLETED,
		});

		return AppResponse(res, 200, null, 'Profit withdrawn successfully');
	});

	closePosition = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { investmentId } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!investmentId) throw new AppError('Investment ID is required', 400);

		const investment = await investmentRepository.findOneById(investmentId);
		if (!investment || investment.userId !== user.id) {
			throw new AppError('Investment not found', 404);
		}

		const profit = Number(investment.dailyProfit) || 0;
		const initialAmount = Number(investment.amount) || 0;
		const totalToReturn = initialAmount + profit;

		const walletArr = await walletRepository.findByUserId(user.id);
		const userWallet = walletArr[0];

		await walletRepository.update(userWallet.id, {
			balance: Number(userWallet.balance) + totalToReturn,
			portfolioBalance: Math.max(0, Number(userWallet.portfolioBalance) - initialAmount),
		});

		await investmentRepository.update(investmentId, {
			isDeleted: true,
		});

		await Transaction.add({
			userId: user.id,
			amount: totalToReturn,
			type: 'Investment Closure',
			description: `Closed position in ${investment.name}`,
			reference: referenceGenerator(),
			status: TransactionStatus.COMPLETED,
		});

		return AppResponse(res, 200, null, 'Position closed successfully');
	});
}

export const investmentController = new InvestmentController();
