import {
	EmailJobData,
	LoginEmailData,
	ResetPasswordData,
	ForgotPasswordData,
	WelcomeEmailData,
	SignUpEmailData,
	KycData,
} from '@/common/interfaces';
import { logger } from '@/common/utils';
import nodemailer from 'nodemailer';
import { ENVIRONMENT } from 'src/common/config';
import { forgotPasswordEmail, loginEmail, resetPasswordEmail, signUpEmail, welcomeEmail, KycEmail } from '../templates';

const transporter = nodemailer.createTransport({
	service: 'gmail',
	port: 587,
	auth: {
		user: ENVIRONMENT.EMAIL.GMAIL_USER,
		pass: ENVIRONMENT.EMAIL.GMAIL_PASSWORD,
	},
});

export const sendEmail = async (job: EmailJobData) => {
	const { data, type } = job as EmailJobData;

	let htmlContent: string;
	let subject: string;

	switch (type) {
		case 'signUpEmail':
			htmlContent = signUpEmail(data as SignUpEmailData);
			subject = 'Verify your email to get started with Millennia Trades';
			break;
		case 'welcomeEmail':
			htmlContent = welcomeEmail(data as WelcomeEmailData);
			subject = 'Welcome to Millennia Trades';
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

		// Handle other email types...
		default:
			throw new Error(`No template found for email type: ${type}`);
	}

	const mailOptions = {
		from: `"Millennia Trades" <${ENVIRONMENT.EMAIL.GMAIL_USER}>`,
		to: data.to,
		subject: subject,
		html: htmlContent,
	};

	try {
		const dispatch = await transporter.sendMail(mailOptions);
		console.log(dispatch);
		logger.info(`Email successfully sent to ${data.to}`);
	} catch (error) {
		console.error(error);
		logger.error(`Failed to send email to ${data.to}: ${error}`);
	}
};
