export interface IPlan {
	id: number;
	name: string;
	price: number;
	roi: string;
	duration_days: number;
	min_amount: number | null;
	max_amount: number | null;
	is_active: boolean;
	created_at?: Date;
	updated_at?: Date;
}
