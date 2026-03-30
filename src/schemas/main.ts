import { Role } from '@/common/constants';
import { z } from 'zod';

const passwordRegexMessage =
	'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character or symbol';

export const mainSchema = z.object({
	firstName: z
		.string()
		.min(2, 'First name must be at least 2 characters long')
		.max(50, 'First name must not be 50 characters long'),
	lastName: z
		.string()
		.min(2, 'Last name must be at least 2 characters long')
		.max(50, 'Last name must not be 50 characters long'),
	email: z.string().email('Please enter a valid email address!').toLowerCase(),
	phone: z.string(),
	password: z
		.string()
		.min(8, 'Password must have at least 8 characters!')
		.regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
			message: passwordRegexMessage,
		}),
	confirmPassword: z
		.string()
		.min(8, 'Confirm Password must have at least 8 characters!')
		.regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
			message: passwordRegexMessage,
		}),
	country: z.string(),
	token: z.string(),
	receiveCodeViaEmail: z.boolean(),
	name: z.string().min(3).trim(),
	title: z.string().min(3).trim(),
	role: z.enum([Role.Admin, Role.User, Role.SuperUser]),
	key: z.string(),
	amount: z.number().positive(),
	duration: z.string(),
	lastWatched: z.string(),
	referrerCode: z.string().optional(),
	suspend: z.boolean(),
	dob: z.string(),
	nationality: z.string(),
	address: z.string(),
	city: z.string(),
	postalCode: z.string(),
	documentType: z.string(),
	status: z.string(),
	makeAdmin: z.boolean(),
	userId: z.string().uuid(),
	investmentId: z.string().uuid(),
	transactionId: z.string().uuid(),
	wishlistId: z.string().uuid(),
	symbol: z.string().min(3),
	brand: z.string().min(5),
	crypto: z.string().min(3),
	isRetirement: z.boolean(),
	plan: z.string(),
	retirementAccountType: z.string(),
	type: z.string(),
	durationDays: z.number().int().positive().optional(),
	duration_days: z.number().int().positive().optional(),
	min_amount: z.number().positive().optional(),
	max_amount: z.number().positive().optional(),
	is_active: z.boolean().optional(),
	percentageProfit: z.number().optional(),
	roi: z.string().optional(),
	// hideMyDetails: z.boolean().default(false),
	message: z.string().min(10),
	oldPassword: z.string().min(8),
	newPassword: z
		.string()
		.min(8, 'Password must have at least 8 characters!')
		.regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
			message: passwordRegexMessage,
		}),
	// redirectUrl: z.string().url(),
});

// Define the partial for partial validation
export const partialMainSchema = mainSchema.partial();
