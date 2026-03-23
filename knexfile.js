module.exports = {
	development: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE,
			port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
		},
		pool: {
			min: 1,
			max: 5,
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './migrations',
		},
		seeds: {
			directory: './seeds',
		},
	},

	production: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE,
			port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
			ssl: { rejectUnauthorized: true },
		},
		pool: {
			min: 1,
			max: 5,
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './migrations',
		},
		seeds: {
			directory: './seeds',
		},
	},
};
