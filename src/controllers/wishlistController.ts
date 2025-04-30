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
		if (!name || !symbol || !brand) throw new AppError('Incomplete Watchlist data', 400);

		const isExist = await wishlistRepository.findBySymbolAndUser(symbol, user.id);
		if (isExist) throw new AppError('Watchlist data exists already', 400);

		const [wishlist] = await wishlistRepository.create({
			name,
			symbol,
			brand,
			userId: user.id,
		});
		if (!wishlist) {
			throw new AppError('Failed to add Watchlist', 500);
		}

		return AppResponse(res, 200, toJSON([wishlist]), 'Watchlist added successfully');
	});

	findAll = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const wishlist = await wishlistRepository.findByUserId(user.id);
		if (!wishlist) {
			throw new AppError('No Watchlist found', 404);
		}

		return AppResponse(res, 200, toJSON(wishlist), 'User Watchlist retrieved successfully');
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
			throw new AppError('Watchlist not found', 404);
		}
		if (wishlist.isDeleted) throw new AppError('Watchlist has been deleted already', 400);

		const removeList = await wishlistRepository.update(wishlistId, { isDeleted: true });
		if (!removeList) {
			throw new AppError('Failed to delete Watchlist', 400);
		}

		return AppResponse(res, 200, null, 'Watchlist removed successfully');
	});
}

export const wishlistController = new WishlistController();
