import { Role } from '../constants';

export interface IUser {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	country: string;
	resolvedCountry: string;
	password: string;
	ipAddress: string;
	photo: string;
	role: Role;
	passwordResetRetries: number;
	passwordResetToken: string;
	passwordResetExpires: Date;
	passwordChangedAt: Date;
	loginRetries: number;
	lastLogin: Date;
	isEmailVerified: boolean;
	verificationToken: string;
	verificationTokenExpires: Date;
	tokenIsUsed: boolean;
	isSuspended: boolean;
	referralCode: string;
	referralCredits?: number;
	isDeleted: boolean;
	created_at?: Date;
	updated_at?: Date;
}
