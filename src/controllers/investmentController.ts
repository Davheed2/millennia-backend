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

function resolvePercentageAndDuration(
	planName: string,
	isRetirement: boolean,
	reqPercentage?: number,
	reqAmount?: number,
	sysPlan?: any
) {
	let percentage = reqPercentage || 0;
	let amount = reqAmount || 0;

	// If no amount/percentage provided, use defaults (legacy behavior)
	if (!reqPercentage && !reqAmount) {
		const planLower = planName.toLowerCase();
		if (
			planLower.includes('basic') ||
			planLower.includes('starter') ||
			planLower.includes('foundation') ||
			planLower.includes('entry')
		) {
			amount = isRetirement ? 5000 : 500;
			percentage = 10; // Default middle for 8-12%
		} else if (
			planLower.includes('plus') ||
			planLower.includes('silver') ||
			planLower.includes('explore')
		) {
			amount = isRetirement ? 10000 : 5000;
			percentage = 20; // Default middle for 18-22%
		} else if (planLower.includes('gold')) {
			amount = 10000;
			percentage = 27;
		} else if (planLower.includes('platinum')) {
			amount = 25000;
			percentage = 32;
		} else if (planLower.includes('diamond')) {
			amount = 50000;
			percentage = 37;
		} else if (planLower.includes('bullish')) {
			amount = 50000;
			percentage = 57;
		} else if (planLower.includes('vip elite')) {
			amount = 100000;
			percentage = 47;
		} else if (planLower.includes('indicators')) {
			amount = 1000;
			percentage = 37.5;
		} else if (planLower.includes('trial')) {
			amount = 100;
			percentage = 5.2;
		}
	}

	// If a system plan is provided, we use its ROI if percentage is not provided
	if (sysPlan && percentage === 0) {
		const roiMatch = sysPlan.roi.match(/(\d+)\s*-\s*(\d+)/);
		if (roiMatch) {
			const min = parseInt(roiMatch[1]);
			const max = parseInt(roiMatch[2]);
			percentage = (min + max) / 2; // Default to average ROI
		} else {
			percentage = parseFloat(sysPlan.roi) || 0;
		}
	}

	return { percentage, amount };
}

export class InvestmentController {
	confirm = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { plan, type, symbol, name, amount: reqAmount, percentageProfit } = req.body;
		const isRetirement = req.body.isRetirement === true || req.body.isRetirement === 'true';

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		let walletBalance = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({ userId: user.id, isDemo: req.isDemoMode || false });
		}

		const sysPlan = await planRepository.findByName(plan);
		const { percentage, amount } = resolvePercentageAndDuration(plan, isRetirement, percentageProfit, reqAmount, sysPlan);

		if (amount <= 0) throw new AppError('Invalid investment amount', 400);

		if (sysPlan) {
			if (sysPlan.min_amount && amount < Number(sysPlan.min_amount)) {
				throw new AppError(`Minimum investment for ${plan} is $${sysPlan.min_amount}`, 400);
			}
			if (sysPlan.max_amount && amount > Number(sysPlan.max_amount)) {
				throw new AppError(`Maximum investment for ${plan} is $${sysPlan.max_amount}`, 400);
			}
		}

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
			plan,
			retirementAccountType,
			type,
			symbol,
			name,
			amount: reqAmount,
			percentageProfit,
		} = req.body;
		const isRetirement = req.body.isRetirement === true || req.body.isRetirement === 'true';

		if (!user) throw new AppError('Please log in again', 400);
		if (!plan) throw new AppError('Plan is required', 400);
		if (!name) throw new AppError('Ticker name is required', 400);
		if (!type) throw new AppError('Investment Type is required', 400);
		if (!symbol) throw new AppError('Symbol is required', 400);

		const sysPlan = await planRepository.findByName(plan);

		let walletBalance = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
		if (!walletBalance || walletBalance.length === 0) {
			walletBalance = await walletRepository.create({ userId: user.id, isDemo: req.isDemoMode || false });
		}

		const { percentage, amount } = resolvePercentageAndDuration(plan, isRetirement, percentageProfit, reqAmount, sysPlan);

		if (amount <= 0) throw new AppError('Invalid investment amount', 400);

		if (sysPlan) {
			if (sysPlan.min_amount && amount < Number(sysPlan.min_amount)) {
				throw new AppError(`Minimum investment for ${plan} is $${sysPlan.min_amount}`, 400);
			}
			if (sysPlan.max_amount && amount > Number(sysPlan.max_amount)) {
				throw new AppError(`Maximum investment for ${plan} is $${sysPlan.max_amount}`, 400);
			}
		}

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
			isDemo: req.isDemoMode || false,
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
					isDemo: req.isDemoMode || false,
				});
			} catch (error) {
				logger.error(error);
			}
		});
	});

	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 400);

		const investment = await investmentRepository.findByUserId(user.id, req.isDemoMode || false);
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

		const investment = await investmentRepository.findById(investmentId as string, req.isDemoMode || false);
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

		const investment = await investmentRepository.findOneById(investmentId, req.isDemoMode || false);
		if (!investment || investment.userId !== user.id) {
			throw new AppError('Investment not found', 404);
		}

		const profit = Number(investment.dailyProfit) || 0;
		if (profit <= 0) throw new AppError('No profit to withdraw', 400);

		const walletArr = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
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
			isDemo: req.isDemoMode || false,
		});

		return AppResponse(res, 200, null, 'Profit withdrawn successfully');
	});

	closePosition = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { investmentId } = req.body;

		if (!user) throw new AppError('Please log in again', 400);
		if (!investmentId) throw new AppError('Investment ID is required', 400);

		const investment = await investmentRepository.findOneById(investmentId, req.isDemoMode || false);
		if (!investment || investment.userId !== user.id) {
			throw new AppError('Investment not found', 404);
		}

		const profit = Number(investment.dailyProfit) || 0;
		const initialAmount = Number(investment.amount) || 0;
		const totalToReturn = initialAmount + profit;

		const walletArr = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
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
			isDemo: req.isDemoMode || false,
		});

		return AppResponse(res, 200, null, 'Position closed successfully');
	});
}

export const investmentController = new InvestmentController();
