import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// 1. Drop the old check constraint on assets.type
	await knex.raw(`ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check`);

	// 2. Add sector column (sub-category e.g. 'crude_oil', 'natural_gas' within oil_gas)
	await knex.schema.alterTable('assets', (table) => {
		table.string('sector').nullable();
	});

	// 3. Re-add constraint with expanded enum values
	await knex.raw(`
		ALTER TABLE assets
		ADD CONSTRAINT assets_type_check
		CHECK (type IN ('stock', 'etf', 'crypto', 'energy', 'oil_gas', 'forex', 'commodity'))
	`);
}

export async function down(knex: Knex): Promise<void> {
	// Drop new constraint
	await knex.raw(`ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check`);

	// Drop sector column
	await knex.schema.alterTable('assets', (table) => {
		table.dropColumn('sector');
	});

	// Restore original constraint
	await knex.raw(`
		ALTER TABLE assets
		ADD CONSTRAINT assets_type_check
		CHECK (type IN ('stock', 'etf'))
	`);
}
