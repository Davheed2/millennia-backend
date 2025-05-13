export interface CommonDataFields {
	to: string;
	priority: string;
}

export interface SignUpEmailData extends CommonDataFields {
	name: string;
	verificationUrl: string;
}

export interface WelcomeEmailData extends CommonDataFields {
	name: string;
}

export interface LoginEmailData extends CommonDataFields {
	name: string;
	time: string;
}

export interface ForgotPasswordData extends CommonDataFields {
	resetLink: string;
	name: string;
}

export interface ResetPasswordData extends CommonDataFields {
	name: string;
}

export interface KycData extends CommonDataFields {
	name: string;
	status: 'approved' | 'rejected';
}

export interface ProcessingDepositData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export interface SuccessfulDepositData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export interface FailedDepositData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export interface ProcessingWithdrawalData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export interface SuccessfulWithdrawalData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export interface FailedWithdrawalData extends CommonDataFields {
	name: string;
	amount: number;
	reference: string;
}

export type EmailJobData =
	| { type: 'signUpEmail'; data: SignUpEmailData }
	| { type: 'welcomeEmail'; data: WelcomeEmailData }
	| { type: 'loginEmail'; data: LoginEmailData }
	| { type: 'forgotPassword'; data: ForgotPasswordData }
	| { type: 'resetPassword'; data: ResetPasswordData }
	| { type: 'kyc'; data: KycData }
	| { type: 'processingDeposit'; data: ProcessingDepositData }
	| { type: 'successfulDeposit'; data: SuccessfulDepositData }
	| { type: 'failedDeposit'; data: FailedDepositData }
	| { type: 'processingWithdrawal'; data: ProcessingWithdrawalData }
	| { type: 'successfulWithdrawal'; data: SuccessfulWithdrawalData }
	| { type: 'failedWithdrawal'; data: FailedWithdrawalData };
