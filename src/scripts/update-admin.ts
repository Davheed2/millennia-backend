const knexConfig = require('../knexfile.js');

const db = knexConfig.development;

async function updateAdmin() {
	try {
		const updated = await db('users').where({ email: 'admin@gmail.com' }).update({
			isEmailVerified: true,
			role: 'admin',
			tokenIsUsed: true,
		});

		console.log('Admin updated:', updated);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await db.destroy();
	}
}

updateAdmin();
