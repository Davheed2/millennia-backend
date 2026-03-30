import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { planRepository } from '@/repository';

export class PlanController {
	getAllPlans = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 401);
		if (user.role === 'user') throw new AppError('Only admins can view all plans', 403);

		const plans = await planRepository.findAll();
		return AppResponse(res, 200, toJSON(plans), 'Plans fetched successfully');
	});

	getActivePlans = catchAsync(async (req: Request, res: Response) => {
		const plans = await planRepository.findAllActive();
		return AppResponse(res, 200, toJSON(plans), 'Active plans fetched successfully');
	});

	getPlanById = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { id } = req.params;

		if (!user) throw new AppError('Please log in again', 401);
		if (user.role === 'user') throw new AppError('Only admins can view plan details', 403);

		const plan = await planRepository.findById(Number(id));
		if (!plan) throw new AppError('Plan not found', 404);

		return AppResponse(res, 200, toJSON([plan]), 'Plan fetched successfully');
	});

	createPlan = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) throw new AppError('Please log in again', 401);
		if (user.role === 'user') throw new AppError('Only admins can create plans', 403);

		const { name, price, roi, duration_days, min_amount, max_amount, is_active } = req.body;

		if (!name) throw new AppError('Plan name is required', 400);
		if (!price) throw new AppError('Plan price is required', 400);
		if (!roi) throw new AppError('ROI is required', 400);
		if (!duration_days) throw new AppError('Duration (days) is required', 400);

		const existing = await planRepository.findByName(name);
		if (existing) throw new AppError('A plan with this name already exists', 400);

		const [plan] = await planRepository.create({
			name,
			price: Number(price),
			roi,
			duration_days: Number(duration_days),
			min_amount: min_amount ? Number(min_amount) : null,
			max_amount: max_amount ? Number(max_amount) : null,
			is_active: is_active !== undefined ? Boolean(is_active) : true,
		});

		return AppResponse(res, 201, toJSON([plan]), 'Plan created successfully');
	});

	updatePlan = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { id } = req.params;

		if (!user) throw new AppError('Please log in again', 401);
		if (user.role === 'user') throw new AppError('Only admins can update plans', 403);

		const plan = await planRepository.findById(Number(id));
		if (!plan) throw new AppError('Plan not found', 404);

		const { name, price, roi, duration_days, min_amount, max_amount, is_active } = req.body;

		const updateData: Record<string, unknown> = {};
		if (name !== undefined) updateData.name = name;
		if (price !== undefined) updateData.price = Number(price);
		if (roi !== undefined) updateData.roi = roi;
		if (duration_days !== undefined) updateData.duration_days = Number(duration_days);
		if (min_amount !== undefined) updateData.min_amount = min_amount ? Number(min_amount) : null;
		if (max_amount !== undefined) updateData.max_amount = max_amount ? Number(max_amount) : null;
		if (is_active !== undefined) updateData.is_active = Boolean(is_active);

		if (Object.keys(updateData).length === 0) {
			throw new AppError('No valid fields to update', 400);
		}

		const [updated] = await planRepository.update(Number(id), updateData);

		return AppResponse(res, 200, toJSON([updated]), 'Plan updated successfully');
	});

	deletePlan = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { id } = req.params;

		if (!user) throw new AppError('Please log in again', 401);
		if (user.role === 'user') throw new AppError('Only admins can delete plans', 403);

		const plan = await planRepository.findById(Number(id));
		if (!plan) throw new AppError('Plan not found', 404);

		await planRepository.delete(Number(id));

		return AppResponse(res, 200, null, 'Plan deleted successfully');
	});
}

export const planController = new PlanController();
