const knex = require('knex')({
	client: 'pg',
	connection: {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		port: process.env.DB_PORT || 5432,
	},
});

async function updateAdmin() {
	try {
		const updated = await knex('users').where({ email: 'admin@gmail.com' }).update({
			isEmailVerified: true,
			role: 'admin',
			tokenIsUsed: true,
		});

		console.log('Admin updated:', updated);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await knex.destroy();
	}
}

updateAdmin();
