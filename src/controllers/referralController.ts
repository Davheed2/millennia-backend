import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { referralRepository } from '@/repository';

export class ReferralController {
	findByReferrerId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const referrals = await referralRepository.findByReferrerId(user.id);
		if (!referrals) {
			throw new AppError('No referrals found', 404);
		}

		return AppResponse(res, 200, toJSON(referrals), 'Referrals retrieved successfully');
	});
}

export const referralController = new ReferralController();
