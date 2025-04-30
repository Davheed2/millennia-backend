import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlist', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('SET NULL');
		table.string('name').notNullable();
		table.string('brand').notNullable();
		table.string('symbol').notNullable();
        table.boolean('isDeleted').notNullable().defaultTo(false);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlist');
}
