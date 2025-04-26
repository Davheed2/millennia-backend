export interface IKyc {
	id: string;
	userId: string;
	name: string;
	dob: string;
	nationality: string;
	address: string;
	city: string;
	postalCode: string;
	documentType: string;
	document: string;
	selfie: string;
	status: string;
	created_at?: Date;
	updated_at?: Date;
}
