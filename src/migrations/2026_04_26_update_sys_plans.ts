import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Delete existing plans
	await knex('sys_plan').del();

	// Insert new plans
	await knex('sys_plan').insert([
		{
			name: 'STARTER PLAN',
			price: 500,
			min_amount: 500.0,
			max_amount: 4999.0,
			roi: '8 - 12%',
			duration_days: 21, // 3 Weeks
			is_active: true,
		},
		{
			name: 'SILVER PLAN',
			price: 5000,
			min_amount: 5000.0,
			max_amount: 9999.0,
			roi: '18 - 22%',
			duration_days: 21, // 3 Weeks
			is_active: true,
		},
		{
			name: 'GOLD PLAN',
			price: 10000,
			min_amount: 10000.0,
			max_amount: 24999.0,
			roi: '25 - 29%',
			duration_days: 30, // 1 Month
			is_active: true,
		},
		{
			name: 'PLATINUM PLAN',
			price: 25000,
			min_amount: 25000.0,
			max_amount: 49999.0,
			roi: '30 - 34%',
			duration_days: 30, // 1 Month
			is_active: true,
		},
		{
			name: 'DIAMOND PLAN',
			price: 50000,
			min_amount: 50000.0,
			max_amount: 99999.0,
			roi: '35 - 39%',
			duration_days: 30, // 1 Month
			is_active: true,
		},
		{
			name: 'BULLISH TRADE (TWICE ANNUALLY)',
			price: 50000,
			min_amount: 50000.0,
			max_amount: 300000.0,
			roi: '55 - 59%',
			duration_days: 30, // 1 Month
			is_active: true,
		},
		{
			name: 'VIP ELITE PLAN (UNLIMITED)',
			price: 100000,
			min_amount: 100000.0,
			max_amount: 1000000.0,
			roi: '45 - 49%',
			duration_days: 14, // 2 Weeks
			is_active: true,
		},
		{
			name: 'INDICATORS & SIGNALS',
			price: 1000,
			min_amount: 1000.0,
			max_amount: null,
			roi: '35 - 40%',
			duration_days: 30, // 1 Month
			is_active: true,
		},
	]);
}

export async function down(knex: Knex): Promise<void> {
	await knex('sys_plan').del();
}
