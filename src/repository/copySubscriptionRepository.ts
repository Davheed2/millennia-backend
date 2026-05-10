import { knexDb } from '@/common/config';
import { ICopySubscription } from '@/common/interfaces';
import { DateTime } from 'luxon';

class CopySubscriptionRepository {
	create: (payload: Partial<ICopySubscription>) => Promise<any>;
	findById: (id: string) => Promise<any>;
	findByFollowerAndTrader: (followerId: string, traderId: string, isDemo?: boolean) => Promise<any>;
	findActiveSubscriptionsByTrader: (traderId: string) => Promise<any>;
	findSubscriptionsByFollower: (followerId: string, isDemo?: boolean) => Promise<any>;
	update: (id: string, payload: Partial<ICopySubscription>) => Promise<any>;
	delete: (id: string) => Promise<any>;
	findTopFollowersByTrader: (traderId: string, limit?: number) => Promise<any>;

	constructor() {
		this.create = async (payload: Partial<ICopySubscription>) => {
			return await knexDb.table('copy_subscriptions').insert(payload).returning('*');
		};

		this.findById = async (id: string) => {
			return await knexDb.table('copy_subscriptions').where({ id }).first();
		};

		this.findByFollowerAndTrader = async (followerId: string, traderId: string, isDemo: boolean = false) => {
			return await knexDb.table('copy_subscriptions').where({ followerId, traderId, isDemo }).first();
		};

		this.findActiveSubscriptionsByTrader = async (traderId: string) => {
			return await knexDb.table('copy_subscriptions').where({ traderId, status: 'active' });
		};

		this.findSubscriptionsByFollower = async (followerId: string, isDemo: boolean = false) => {
			return await knexDb.table('copy_subscriptions')
				.join('traders', 'copy_subscriptions.traderId', '=', 'traders.id')
				.select('copy_subscriptions.*', 'traders.displayName', 'traders.avatarUrl')
				.where({ followerId, 'copy_subscriptions.isDemo': isDemo });
		};

		this.update = async (id: string, payload: Partial<ICopySubscription>) => {
			return await knexDb('copy_subscriptions')
				.where({ id })
				.update({ ...payload, updated_at: DateTime.now().toJSDate() })
				.returning('*');
		};

		this.delete = async (id: string) => {
			return await knexDb('copy_subscriptions').where({ id }).del();
		};

		this.findTopFollowersByTrader = async (traderId: string, limit = 10) => {
			return await knexDb.table('copy_subscriptions')
				.join('users', 'copy_subscriptions.followerId', '=', 'users.id')
				.select(
					'copy_subscriptions.*',
					'users.firstName',
					'users.lastName',
					knexDb.raw("CONCAT(\"users\".\"firstName\", ' ', \"users\".\"lastName\") as \"displayName\""),
					'users.photo as avatarUrl'
				)
				.where({ traderId, status: 'active' })
				.orderBy('allocatedAmount', 'desc')
				.limit(limit);
		};
	}
}

export const copySubscriptionRepository = new CopySubscriptionRepository();
