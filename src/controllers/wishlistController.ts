import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { wishlistRepository } from '@/repository';

export class WishlistController {
	create = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { name, symbol, brand } = req.body;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!name || !symbol || !brand) throw new AppError('Incomplete wishlist data', 400);

		const isExist = await wishlistRepository.findBySymbolAndUser(symbol, user.id);
		if (isExist) throw new AppError('Wishlist data exists already', 400);

		const [wishlist] = await wishlistRepository.create({
			name,
			symbol,
			brand,
			userId: user.id,
		});
		if (!wishlist) {
			throw new AppError('Failed to add wishlist', 500);
		}

		return AppResponse(res, 200, toJSON([wishlist]), 'Wishlist added successfully');
	});

	findAll = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const wishlist = await wishlistRepository.findByUserId(user.id);
		if (!wishlist) {
			throw new AppError('No wishlist found', 404);
		}

		return AppResponse(res, 200, toJSON(wishlist), 'User wishlist retrieved successfully');
	});

	delete = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { wishlistId } = req.body;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!wishlistId) throw new AppError('Wishlist ID is required', 400);

		const wishlist = await wishlistRepository.findById(wishlistId);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}
		if (wishlist.isDeleted) throw new AppError('Wishlist has been deleted already', 400);

		const removeList = await wishlistRepository.update(wishlistId, { isDeleted: true });
		if (!removeList) {
			throw new AppError('Failed to delete wishlist', 400);
		}

		return AppResponse(res, 200, null, 'Wishlist removed successfully');
	});
}

export const wishlistController = new WishlistController();
