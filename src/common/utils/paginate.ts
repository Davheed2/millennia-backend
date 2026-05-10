import { Knex } from 'knex';

export interface PaginationParams {
	page?: number;
	limit?: number;
}

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

/**
 * Standardized pagination helper for Knex queries.
 * @param query The Knex query builder instance.
 * @param params Object containing page and limit.
 */
export const paginate = async <T>(
	query: Knex.QueryBuilder,
	params: PaginationParams = {}
): Promise<PaginatedResponse<T>> => {
	const page = Math.max(1, Number(params.page) || 1);
	const limit = Math.max(1, Math.min(100, Number(params.limit) || 20)); // Limit between 1 and 100
	const offset = (page - 1) * limit;

	// Clone the query to get the total count without limit/offset
	const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
	const totalResult = await countQuery;
	const total = Number(totalResult?.total) || 0;

	// Execute the paginated query
	const data = await query.limit(limit).offset(offset);

	return {
		data,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};
