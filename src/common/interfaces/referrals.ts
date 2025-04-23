export interface IReferral {
	id: string;
	referrerId: string;
	referreeId: string;
	referreeFirstName: string;
	referreeLastName: string;
	hasInvested: boolean;
	created_at?: Date;
	updated_at?: Date;
}
