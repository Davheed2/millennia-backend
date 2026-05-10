import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/utils';

export const restrictTo = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return next(new AppError('You are not logged in', 401));
		}

		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action', 403));
		}

		next();
	};
};
