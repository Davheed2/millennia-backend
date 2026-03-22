// import {
// 	EmailJobData,
// 	LoginEmailData,
// 	ResetPasswordData,
// 	ForgotPasswordData,
// 	WelcomeEmailData,
// 	SignUpEmailData,
// 	KycData,
// 	ProcessingDepositData,
// 	SuccessfulDepositData,
// 	FailedDepositData,
// 	ProcessingWithdrawalData,
// 	SuccessfulWithdrawalData,
// 	FailedWithdrawalData,
// 	NewMessageData,
// 	AdminNewMessageData,
// } from '@/common/interfaces';
// import { logger } from '@/common/utils';
// import nodemailer from 'nodemailer';
// import { ENVIRONMENT } from 'src/common/config';
// import {
// 	forgotPasswordEmail,
// 	loginEmail,
// 	resetPasswordEmail,
// 	signUpEmail,
// 	welcomeEmail,
// 	KycEmail,
// 	DepositProcessingEmail,
// 	DepositSuccessEmail,
// 	DepositFailedEmail,
// 	WithdrawalProcessingEmail,
// 	WithdrawalSuccessEmail,
// 	WithdrawalFailedEmail,
// 	NewMessageEmail,
// 	AdminNewMessageEmail,
// } from '../templates';
// import { Job } from 'bullmq';

// const transporter = nodemailer.createTransport({
// 	//service: 'gmail',
// 	// host: 'smtp.zoho.com',
// 	// port: 465, // SSL
// 	// secure: true, // use true for port 465
// 	host: 'smtp.zeptomail.com',
// 	port: 587,
// 	secure: false,
// 	auth: {
// 		user: ENVIRONMENT.EMAIL.GMAIL_USER,
// 		pass: ENVIRONMENT.EMAIL.GMAIL_PASSWORD,
// 	},
// });

// export const sendEmail = async (job: Job<EmailJobData>) => {
// 	const { type, data } = job.data;

// 	let htmlContent: string;
// 	let subject: string;

// 	logger.info(`Sending email with type: ${type}`);

// 	switch (type) {
// 		case 'signUpEmail':
// 			htmlContent = signUpEmail(data as SignUpEmailData);
// 			subject = 'Verify your email to get started with Alpsector';
// 			break;
// 		case 'welcomeEmail':
// 			htmlContent = welcomeEmail(data as WelcomeEmailData);
// 			subject = 'Welcome to Alpsector';
// 			break;
// 		case 'loginEmail':
// 			htmlContent = loginEmail(data as LoginEmailData);
// 			subject = 'Login Alert';
// 			break;
// 		case 'forgotPassword':
// 			htmlContent = forgotPasswordEmail(data as ForgotPasswordData);
// 			subject = 'Forgot Password';
// 			break;
// 		case 'resetPassword':
// 			htmlContent = resetPasswordEmail(data as ResetPasswordData);
// 			subject = 'Reset Password';
// 			break;
// 		case 'kyc': {
// 			const kycData = data as KycData;
// 			htmlContent = KycEmail(kycData);
// 			subject = kycData.status === 'approved' ? 'KYC Approved' : 'KYC Rejected';
// 			break;
// 		}
// 		case 'processingDeposit':
// 			htmlContent = DepositProcessingEmail(data as ProcessingDepositData);
// 			subject = 'Your deposit is being processed';
// 			break;
// 		case 'successfulDeposit':
// 			htmlContent = DepositSuccessEmail(data as SuccessfulDepositData);
// 			subject = 'Successful Deposit';
// 			break;
// 		case 'failedDeposit':
// 			htmlContent = DepositFailedEmail(data as FailedDepositData);
// 			subject = 'Failed Deposit';
// 			break;
// 		case 'processingWithdrawal':
// 			htmlContent = WithdrawalProcessingEmail(data as ProcessingWithdrawalData);
// 			subject = 'Your withdrawal request is being processed';
// 			break;
// 		case 'successfulWithdrawal':
// 			htmlContent = WithdrawalSuccessEmail(data as SuccessfulWithdrawalData);
// 			subject = 'Successful Withdrawal';
// 			break;
// 		case 'failedWithdrawal':
// 			htmlContent = WithdrawalFailedEmail(data as FailedWithdrawalData);
// 			subject = 'Failed Withdrawal';
// 			break;
// 		case 'newMessage':
// 			htmlContent = NewMessageEmail(data as NewMessageData);
// 			subject = 'New Message Alert';
// 			break;
// 		case 'adminNewMessage':
// 			htmlContent = AdminNewMessageEmail(data as AdminNewMessageData);
// 			subject = 'New Message Alert';
// 			break;
// 		// Handle other email types...
// 		default:
// 			throw new Error(`No template found for email type: ${type}`);
// 	}

// 	const mailOptions = {
// 		from: `"Alpsector" <support@milleniatrades.com>`,
// 		to: data.to,
// 		subject: subject,
// 		html: htmlContent,
// 	};

// 	try {
// 		const dispatch = await transporter.sendMail(mailOptions);
// 		console.log(dispatch);
// 		logger.info(`Email successfully sent to ${data.to}`);
// 	} catch (error) {
// 		console.error(error);
// 		logger.error(`Failed to send email to ${data.to}: ${error}`);
// 	}
// };

import {
	EmailJobData,
	LoginEmailData,
	ResetPasswordData,
	ForgotPasswordData,
	WelcomeEmailData,
	SignUpEmailData,
	KycData,
	ProcessingDepositData,
	SuccessfulDepositData,
	FailedDepositData,
	ProcessingWithdrawalData,
	SuccessfulWithdrawalData,
	FailedWithdrawalData,
	NewMessageData,
	AdminNewMessageData,
} from '@/common/interfaces';
import { logger } from '@/common/utils';
import { Resend } from 'resend';
import { ENVIRONMENT } from 'src/common/config';
import {
	forgotPasswordEmail,
	loginEmail,
	resetPasswordEmail,
	signUpEmail,
	welcomeEmail,
	KycEmail,
	DepositProcessingEmail,
	DepositSuccessEmail,
	DepositFailedEmail,
	WithdrawalProcessingEmail,
	WithdrawalSuccessEmail,
	WithdrawalFailedEmail,
	NewMessageEmail,
	AdminNewMessageEmail,
} from '../templates';
import { Job } from 'bullmq';

// Initialize Resend with your API key
const resend = new Resend(ENVIRONMENT.EMAIL.RESEND_API_KEY);

export const sendEmail = async (job: Job<EmailJobData>) => {
	const { type, data } = job.data;

	let htmlContent: string;
	let subject: string;

	logger.info(`Sending email with type: ${type}`);

	switch (type) {
		case 'signUpEmail':
			htmlContent = signUpEmail(data as SignUpEmailData);
			subject = 'Verify your email to get started with Alpsector';
			break;
		case 'welcomeEmail':
			htmlContent = welcomeEmail(data as WelcomeEmailData);
			subject = 'Welcome to Alpsector';
			break;
		case 'loginEmail':
			htmlContent = loginEmail(data as LoginEmailData);
			subject = 'Login Alert';
			break;
		case 'forgotPassword':
			htmlContent = forgotPasswordEmail(data as ForgotPasswordData);
			subject = 'Forgot Password';
			break;
		case 'resetPassword':
			htmlContent = resetPasswordEmail(data as ResetPasswordData);
			subject = 'Reset Password';
			break;
		case 'kyc': {
			const kycData = data as KycData;
			htmlContent = KycEmail(kycData);
			subject = kycData.status === 'approved' ? 'KYC Approved' : 'KYC Rejected';
			break;
		}
		case 'processingDeposit':
			htmlContent = DepositProcessingEmail(data as ProcessingDepositData);
			subject = 'Your deposit is being processed';
			break;
		case 'successfulDeposit':
			htmlContent = DepositSuccessEmail(data as SuccessfulDepositData);
			subject = 'Successful Deposit';
			break;
		case 'failedDeposit':
			htmlContent = DepositFailedEmail(data as FailedDepositData);
			subject = 'Failed Deposit';
			break;
		case 'processingWithdrawal':
			htmlContent = WithdrawalProcessingEmail(data as ProcessingWithdrawalData);
			subject = 'Your withdrawal request is being processed';
			break;
		case 'successfulWithdrawal':
			htmlContent = WithdrawalSuccessEmail(data as SuccessfulWithdrawalData);
			subject = 'Successful Withdrawal';
			break;
		case 'failedWithdrawal':
			htmlContent = WithdrawalFailedEmail(data as FailedWithdrawalData);
			subject = 'Failed Withdrawal';
			break;
		case 'newMessage':
			htmlContent = NewMessageEmail(data as NewMessageData);
			subject = 'New Message Alert';
			break;
		case 'adminNewMessage':
			htmlContent = AdminNewMessageEmail(data as AdminNewMessageData);
			subject = 'New Message Alert';
			break;
		default:
			throw new Error(`No template found for email type: ${type}`);
	}

	try {
		const result = await resend.emails.send({
			from: 'Alpsector <support@milleniatrades.com>',
			to: data.to,
			subject: subject,
			html: htmlContent,
		});

		console.log(result);
		logger.info(`Email successfully sent to ${data.to}`);
	} catch (error) {
		console.error(error);
		logger.error(`Failed to send email to ${data.to}: ${error}`);
	}
};
