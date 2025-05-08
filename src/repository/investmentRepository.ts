import { knexDb } from '@/common/config';
import { IInvestment } from '@/common/interfaces';
import { DateTime } from 'luxon';

class InvestmentRepository {
	create = async (payload: Partial<IInvestment>) => {
		return await knexDb.table('investments').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IInvestment | null> => {
		return await knexDb.table('investments').where({ id }).first();
	};

	findByUserId = async (
		userId: string
	): Promise<
		{
			id: string;
			name: string;
			amount: number;
			plan: string;
			type: string;
			symbol: string;
			retirementAccountType: string | null;
			dailyProfit: number | null;
			initialAmount: number;
			userId: string;
			isRetirement: boolean;
			isSwitchedOff: boolean;
			isDeleted: boolean;
			created_at: Date;
			shares: number;
			change_percentage: number | null;
			price: number;
			performance_ytd: number | null;
		}[]
	> => {
		const investments = await knexDb
			.table('investments')
			.where({ userId, isDeleted: false })
			.select(
				'investments.symbol',
				'investments.type',
				knexDb.raw('COUNT(*) as shares'),
				knexDb.raw('MIN("investments"."id"::text) as id'),
				knexDb.raw('MIN("investments"."name") as name'),
				knexDb.raw('MIN("investments"."amount") as amount'),
				knexDb.raw('MIN("investments"."plan") as plan'),
				knexDb.raw('MIN("investments"."retirementAccountType") as retirementAccountType'),
				knexDb.raw('MIN("investments"."dailyProfit") as dailyProfit'),
				knexDb.raw('MIN("investments"."initialAmount") as initialAmount'),
				knexDb.raw('MIN("investments"."userId"::text) as userId'),
				knexDb.raw('BOOL_OR("investments"."isRetirement") as isRetirement'),
				knexDb.raw('BOOL_OR("investments"."isSwitchedOff") as isSwitchedOff'),
				knexDb.raw('MIN("investments"."created_at") as created_at'),
				'asset_metrics.change_percentage',
				'asset_metrics.price',
				'asset_metrics.performance_ytd'
			)
			.leftJoin('assets', 'investments.symbol', 'assets.symbol')
			.leftJoin('asset_metrics', 'assets.id', 'asset_metrics.asset_id')
			.groupBy(
				'investments.symbol',
				'investments.type',
				'asset_metrics.change_percentage',
				'asset_metrics.price',
				'asset_metrics.performance_ytd'
			);

		return investments;
	};

	update = async (id: string, payload: Partial<IInvestment>): Promise<IInvestment[]> => {
		return await knexDb('investments')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};
}

export const investmentRepository = new InvestmentRepository();
