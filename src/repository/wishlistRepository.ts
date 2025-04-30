import { knexDb } from '@/common/config';
import { IWishlist } from '@/common/interfaces';
import { DateTime } from 'luxon';

class WishlistRepository {
	create = async (payload: Partial<IWishlist>) => {
		return await knexDb.table('wishlist').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IWishlist | null> => {
		return await knexDb.table('wishlist').where({ id }).first();
	};

	findBySymbolAndUser = async (symbol: string, userId: string): Promise<IWishlist | null> => {
		return await knexDb.table('wishlist').where({ symbol }).andWhere({ userId }).andWhere({ isDeleted: false }).first();
	};

	update = async (id: string, payload: Partial<IWishlist>): Promise<IWishlist[]> => {
		return await knexDb('wishlist')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findByUserId = async (
		userId: string
	): Promise<{ wishlist: IWishlist; metrics: { change_percentage: number; price: number } }[]> => {
		const wishlistWithMetrics = await knexDb
			.table('wishlist')
			.join('assets', 'wishlist.symbol', 'assets.symbol')
			.join('asset_metrics', 'assets.id', 'asset_metrics.asset_id')
			.where({ 'wishlist.userId': userId, 'wishlist.isDeleted': false })
			.select('wishlist.*', 'asset_metrics.change_percentage', 'asset_metrics.price');

		return wishlistWithMetrics.map((item) => ({
			wishlist: {
				id: item.id,
				userId: item.userId,
				symbol: item.symbol,
				name: item.name, // Ensure 'name' is included
				brand: item.brand, // Ensure 'brand' is included
				created_at: item.created_at,
				updated_at: item.updated_at,
				isDeleted: item.isDeleted,
			},
			metrics: {
				change_percentage: item.change_percentage,
				price: item.price,
			},
		}));
	};
}

export const wishlistRepository = new WishlistRepository();
