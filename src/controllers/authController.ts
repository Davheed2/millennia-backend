import { referralRepository, userRepository } from '@/repository';
import { Request, Response } from 'express';
import {
	AppError,
	AppResponse,
	comparePassword,
	createToken,
	generateAccessToken,
	generateReferralCode,
	generateRandomString,
	generateRefreshToken,
	getDomainReferer,
	hashPassword,
	parseTokenDuration,
	sendForgotPasswordEmail,
	sendLoginEmail,
	sendResetPasswordEmail,
	setCookie,
	toJSON,
	verifyToken,
	sendSignUpEmail,
	sendWelcomeEmail,
} from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { ENVIRONMENT } from '@/common/config';
import { DateTime } from 'luxon';
import geoip from 'geoip-lite';
import { IUser } from '@/common/interfaces';

class AuthController {
	signUp = catchAsync(async (req: Request, res: Response) => {
		const { email, password, firstName, lastName, phone, country, referrerCode } = req.body;

		if (!firstName || !lastName || !email || !password || !phone || !country) {
			throw new AppError('Incomplete signup data', 400);
		}

		const existingUser = await userRepository.findByEmailOrPhone(email, phone);
		if (existingUser) {
			if (existingUser.email === email) throw new AppError('User with this email already exists', 409);
			if (existingUser.phone === phone) throw new AppError('User with this phone number already exists', 409);
		}

		let referrer: IUser | null = null;
		if (referrerCode) {
			referrer = await userRepository.findByReferralCode(referrerCode);
			console.log(referrer);
			if (!referrer) {
				throw new AppError('Invalid referral code', 400);
			}
		}

		const hashedPassword = await hashPassword(password);

		const verificationToken = await generateRandomString();
		const hashedVerificationToken = createToken(
			{
				token: verificationToken,
			},
			{ expiresIn: '30d' }
		);
		//console.log(hashedVerificationToken);

		const verificationUrl = `${getDomainReferer(req)}/auth?verify=${hashedVerificationToken}`;
		//console.log(verificationUrl);
		await sendSignUpEmail(email, firstName, verificationUrl);

		const ip = req.ip || req.socket.remoteAddress || '';
		const geo = geoip.lookup(ip);
		const resolvedCountry = geo?.country || undefined;

		const referralCode = generateReferralCode();

		const [user] = await userRepository.create({
			email,
			password: hashedPassword,
			firstName,
			lastName,
			phone,
			country,
			ipAddress: req.ip,
			verificationToken,
			verificationTokenExpires: DateTime.now().plus({ days: 30 }).toJSDate(),
			resolvedCountry,
			referralCode,
		});
		if (!user) {
			throw new AppError('Failed to create user', 500);
		}

		if (referrer) {
			await referralRepository.create({
				referrerId: referrer.id,
				referreeId: user.id,
				referreeFirstName: firstName,
				referreeLastName: lastName,
				referreeEmail: email,
				hasInvested: false,
			});
		}

		return AppResponse(res, 201, toJSON([user]), `Verification link sent to ${email}`);
	});

	verifyAccount = catchAsync(async (req: Request, res: Response) => {
		const { verificationToken } = req.query;

		if (!verificationToken) {
			throw new AppError('Verification token is required', 400);
		}

		const decodedVerificationToken = await verifyToken(verificationToken as string);
		if (!decodedVerificationToken.token) {
			throw new AppError('Invalid verification token', 401);
		}

		const extinguishUser = await userRepository.findByVerificationToken(decodedVerificationToken.token);
		if (!extinguishUser) {
			throw new AppError('Invalid or expired verification token', 404);
		}
		if (extinguishUser.isEmailVerified) {
			throw new AppError('Account Already Verified', 400);
		}
		if (extinguishUser.tokenIsUsed) {
			throw new AppError('Verification token has already been used', 400);
		}
		if (extinguishUser.verificationTokenExpires < DateTime.now().toJSDate()) {
			throw new AppError('Verification token has expired', 400);
		}

		const updatedUser = await userRepository.update(extinguishUser.id, {
			tokenIsUsed: true,
			isEmailVerified: true,
		});

		await sendWelcomeEmail(extinguishUser.email, extinguishUser.firstName);
		return AppResponse(res, 200, toJSON(updatedUser), 'Email verified successfully');
	});

	resendVerification = catchAsync(async (req: Request, res: Response) => {
		const { email } = req.body;

		if (!email) {
			throw new AppError('Email is required', 400);
		}

		const user = await userRepository.findByEmail(email);
		if (!user) {
			throw new AppError('User not found', 404);
		}

		if (user.isEmailVerified) {
			throw new AppError('Account is already verified', 400);
		}

		// Generate new verification token
		const verificationToken = await generateRandomString();
		const hashedVerificationToken = createToken(
			{
				token: verificationToken,
			},
			{ expiresIn: '30d' }
		);

		const verificationUrl = `${getDomainReferer(req)}/auth?verify=${hashedVerificationToken}`;
		await sendSignUpEmail(user.email, user.firstName, verificationUrl);

		await userRepository.update(user.id, {
			verificationToken,
			verificationTokenExpires: DateTime.now().plus({ days: 30 }).toJSDate(),
			tokenIsUsed: false,
		});

		return AppResponse(res, 200, null, `Verification link sent to ${email}`);
	});

	signIn = catchAsync(async (req: Request, res: Response) => {
		const { email, password } = req.body;

		if (!email || !password) {
			throw new AppError('Incomplete login data', 401);
		}

		const user = await userRepository.findByEmail(email);
		if (!user) {
			throw new AppError('User not found', 404);
		}

		const currentRequestTime = DateTime.now();
		const lastLoginRetry = currentRequestTime.diff(DateTime.fromISO(user.lastLogin.toISOString()), 'hours');

		if (user.loginRetries >= 5 && Math.round(lastLoginRetry.hours) < 12) {
			throw new AppError('login retries exceeded!', 401);
		}

		const isPasswordValid = await comparePassword(password, user.password);
		if (!isPasswordValid) {
			await userRepository.update(user.id, { loginRetries: user.loginRetries + 1 });
			throw new AppError('Invalid credentials', 401);
		}

		if (user.isSuspended) {
			throw new AppError('Your account is currently suspended', 401);
		}
		if (user.isDeleted) {
			throw new AppError('Your account is currently deleted', 401);
		}
		if (!user.isEmailVerified) {
			throw new AppError('Please verify your email address before logging in', 403);
		}

		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);

		setCookie(req, res, 'accessToken', accessToken, parseTokenDuration(ENVIRONMENT.JWT_EXPIRES_IN.ACCESS));
		setCookie(req, res, 'refreshToken', refreshToken, parseTokenDuration(ENVIRONMENT.JWT_EXPIRES_IN.REFRESH));

		await userRepository.update(user.id, {
			loginRetries: 0,
			lastLogin: currentRequestTime.toJSDate(),
		});

		//login email
		const loginTime = DateTime.now().toFormat("cccc, LLLL d, yyyy 'at' t");
		await sendLoginEmail(user.email, user.firstName, loginTime);

		// Return token in response for frontend integration
		res.status(200).json({
			status: 'success',
			data: toJSON([user]),
			token: accessToken,
			refreshToken: refreshToken,
			message: 'User logged in successfully',
		});
	});

	adminSignIn = catchAsync(async (req: Request, res: Response) => {
		const { email, password } = req.body;

		if (!email || !password) {
			throw new AppError('Incomplete login data', 401);
		}

		const user = await userRepository.findByEmail(email);
		if (!user) {
			throw new AppError('User not found', 404);
		}
		if (user.role === 'user') {
			throw new AppError('Unauthorized access', 401);
		}

		const currentRequestTime = DateTime.now();
		const lastLoginRetry = currentRequestTime.diff(DateTime.fromISO(user.lastLogin.toISOString()), 'hours');

		if (user.loginRetries >= 5 && Math.round(lastLoginRetry.hours) < 12) {
			throw new AppError('login retries exceeded!', 401);
		}

		const isPasswordValid = await comparePassword(password, user.password);
		if (!isPasswordValid) {
			await userRepository.update(user.id, { loginRetries: user.loginRetries + 1 });
			throw new AppError('Invalid credentials', 401);
		}

		if (user.isSuspended) {
			throw new AppError('Your account is currently suspended', 401);
		}
		if (user.isDeleted) {
			throw new AppError('Your account is currently deleted', 401);
		}
		if (!user.isEmailVerified) {
			throw new AppError('Please verify your email address before logging in', 403);
		}

		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);

		setCookie(req, res, 'accessToken', accessToken, parseTokenDuration(ENVIRONMENT.JWT_EXPIRES_IN.ACCESS));
		setCookie(req, res, 'refreshToken', refreshToken, parseTokenDuration(ENVIRONMENT.JWT_EXPIRES_IN.REFRESH));

		await userRepository.update(user.id, {
			loginRetries: 0,
			lastLogin: currentRequestTime.toJSDate(),
		});

		//login email
		const loginTime = DateTime.now().toFormat("cccc, LLLL d, yyyy 'at' t");
		await sendLoginEmail(user.email, user.firstName, loginTime);
		return AppResponse(res, 200, toJSON([user]), 'User logged in successfully');
	});

	signOut = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('You are not logged in', 401);
		}

		setCookie(req, res, 'accessToken', 'expired', -1);
		setCookie(req, res, 'refreshToken', 'expired', -1);

		AppResponse(res, 200, null, 'Logout successful');
	});

	forgotPassword = catchAsync(async (req: Request, res: Response) => {
		const { email } = req.body;

		if (!email) {
			throw new AppError('Email is required', 400);
		}

		const user = await userRepository.findByEmail(email);
		if (!user) {
			throw new AppError('No user found with provided email', 404);
		}

		if (user.passwordResetRetries >= 6) {
			await userRepository.update(user.id, {
				isSuspended: true,
			});

			throw new AppError('Password reset retries exceeded! and account suspended', 401);
		}

		const passwordResetToken = await generateRandomString();
		const hashedPasswordResetToken = createToken(
			{
				token: passwordResetToken,
			},
			{ expiresIn: '15m' }
		);

		const passwordResetUrl = `${getDomainReferer(req)}/reset-password?token=${hashedPasswordResetToken}`;

		await userRepository.update(user.id, {
			passwordResetToken: passwordResetToken,
			passwordResetExpires: DateTime.now().plus({ minutes: 15 }).toJSDate(),
			passwordResetRetries: user.passwordResetRetries + 1,
		});

		await sendForgotPasswordEmail(user.email, user.firstName, passwordResetUrl);

		return AppResponse(res, 200, null, `Password reset link sent to ${email}`);
	});

	resetPassword = catchAsync(async (req: Request, res: Response) => {
		const { token, password, confirmPassword } = req.body;

		if (!token || !password || !confirmPassword) {
			throw new AppError('All fields are required', 403);
		}
		if (password !== confirmPassword) {
			throw new AppError('Passwords do not match', 403);
		}

		const decodedToken = await verifyToken(token);
		if (!decodedToken.token) {
			throw new AppError('Invalid token', 401);
		}

		const user = await userRepository.findByPasswordResetToken(decodedToken.token);
		if (!user) {
			throw new AppError('Password reset token is invalid or has expired', 400);
		}

		const isSamePassword = await comparePassword(password, user.password);
		if (isSamePassword) {
			throw new AppError('New password cannot be the same as the old password', 400);
		}

		const hashedPassword = await hashPassword(password);

		const updatedUser = await userRepository.update(user.id, {
			password: hashedPassword,
			passwordResetRetries: 0,
			passwordChangedAt: DateTime.now().toJSDate(),
			passwordResetToken: '',
			passwordResetExpires: DateTime.now().toJSDate(),
		});
		if (!updatedUser) {
			throw new AppError('Password reset failed', 400);
		}

		await sendResetPasswordEmail(user.email, user.firstName);

		return AppResponse(res, 200, null, 'Password reset successfully');
	});

	changePassword = catchAsync(async (req: Request, res: Response) => {
		const { password, confirmPassword } = req.body;
		const { user } = req;

		if (!password || !confirmPassword) {
			throw new AppError('All fields are required', 403);
		}
		if (password !== confirmPassword) {
			throw new AppError('Passwords do not match', 403);
		}
		if (!user) {
			throw new AppError('You are not logged in', 401);
		}

		const extinguishUser = await userRepository.findById(user.id);
		if (!extinguishUser) {
			throw new AppError('User not found', 400);
		}

		const isSamePassword = await comparePassword(password, extinguishUser.password);
		if (isSamePassword) {
			throw new AppError('New password cannot be the same as the old password', 400);
		}

		const hashedPassword = await hashPassword(password);

		const updatedUser = await userRepository.update(extinguishUser.id, {
			password: hashedPassword,
			passwordResetRetries: 0,
			passwordChangedAt: DateTime.now().toJSDate(),
			passwordResetToken: '',
			passwordResetExpires: DateTime.now().toJSDate(),
		});
		if (!updatedUser) {
			throw new AppError('Password reset failed', 400);
		}

		await sendResetPasswordEmail(extinguishUser.email, extinguishUser.firstName);

		return AppResponse(res, 200, null, 'Password reset successfully');
	});

	appHealth = catchAsync(async (req: Request, res: Response) => {
		return AppResponse(res, 200, null, 'Server is healthy');
	});
}

export const authController = new AuthController();
