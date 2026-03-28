import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { Role } from '../common/constants';

export async function seed(knex: Knex): Promise<void> {
	const adminEmail = 'admin@gmail.com';
	const existingAdmin = await knex('users').where({ email: adminEmail }).first();

	if (existingAdmin) {
		console.log('Admin user already exists');
		return;
	}

	const hashedPassword = await bcrypt.hash('Admin123!', 12);

	await knex('users').insert({
		email: adminEmail,
		firstName: 'Admin',
		lastName: 'User',
		password: hashedPassword,
		phone: '+1234567890',
		country: 'United States',
		role: Role.Admin,
		isSuspended: false,
		isDeleted: false,
		verificationToken: 'admin-verification-token',
		tokenIsUsed: true,
		created_at: knex.fn.now(),
		updated_at: knex.fn.now(),
	});

	console.log('Admin user created successfully');
}
