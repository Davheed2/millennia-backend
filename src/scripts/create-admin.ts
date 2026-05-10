import knex from 'knex';
import bcrypt from 'bcryptjs';

const knexConfig = require('../../knexfile.js');

const db = knex(knexConfig.development);

async function createAdmin() {
	try {
		const adminEmail = 'admin@gmail.com';

		const existingAdmin = await db('users').where({ email: adminEmail }).first();

		if (existingAdmin) {
			console.log('Admin user already exists');
			process.exit(0);
		}

		const hashedPassword = await bcrypt.hash('Admin123!', 12);

		await db('users').insert({
			email: adminEmail,
			firstName: 'Admin',
			lastName: 'User',
			password: hashedPassword,
			phone: '+1234567890',
			country: 'United States',
			role: 'admin',
			isSuspended: false,
			isDeleted: false,
			isEmailVerified: true,
			verificationToken: 'admin-verification-token',
			tokenIsUsed: true,
			created_at: db.fn.now(),
			updated_at: db.fn.now(),
		});

		console.log('Admin user created successfully!');
		console.log('Email: admin@gmail.com');
		console.log('Password: Admin123!');
	} catch (error) {
		console.error('Error creating admin:', error);
	} finally {
		await db.destroy();
	}
}

createAdmin();
