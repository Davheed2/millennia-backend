import { knexDb } from '@/common/config';
import { IMessage } from '@/common/interfaces';
import { Knex } from 'knex';
import { DateTime } from 'luxon';
// import { DateTime } from 'luxon';

class MessageRepository {
	create = async (payload: Partial<IMessage>) => {
		return await knexDb.table('messages').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IMessage | null> => {
		return await knexDb.table('messages').where({ id }).first();
	};

	update = async (id: string, payload: Partial<IMessage>): Promise<IMessage[]> => {
		return await knexDb('messages')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	getUserConversation = async (senderId: string, recipientId?: string) => {
		return await knexDb
			.select(
				'messages.*',
				'sender.firstName as senderFirstName',
				'sender.lastName as senderLastName',
				'sender.phone as senderPhone',
				'recipient.firstName as recipientFirstName',
				'recipient.lastName as recipientLastName',
				'recipient.phone as recipientPhone'
			)
			.from('messages')
			.leftJoin('users as sender', 'messages.senderId', 'sender.id')
			.leftJoin('users as recipient', 'messages.recipientId', 'recipient.id')
			.where(function () {
				this.where('messages.senderId', senderId).orWhere('messages.recipientId', senderId);
			})
			.andWhere(function () {
				if (recipientId) {
					this.where('messages.senderId', recipientId).orWhere('messages.recipientId', recipientId);
				} else {
					// For admin view - get all messages where recipient is null
					this.whereNull('messages.recipientId');
				}
			})
			.orderBy('messages.created_at', 'asc');
	};

	getAllUsersLastMessage = async (currentUserId: string) => {
		return await knexDb('users')
			.select(
				'users.id',
				'users.firstName as senderFirstName',
				'users.lastName as senderLastName',
				'users.phone',
				'users.photo as senderProfileImage',
				'last_messages_base.content as lastMessage',
				'last_messages_base.created_at'
			)
			.whereNot('users.id', currentUserId)
			.andWhereNot('users.id', '209bfd5b-124c-4bd1-8151-86ecbde89527')
			.leftJoin(
				// Subquery to get the last message per conversation
				knexDb('messages')
					.select(
						'id',
						'senderId',
						'recipientId',
						'content',
						'created_at',
						knexDb.raw(`
						CASE 
							WHEN "recipientId" IS NULL THEN "senderId"
							ELSE LEAST("senderId", "recipientId") 
						END as user_a
					`),
						knexDb.raw(`
						CASE 
							WHEN "recipientId" IS NULL THEN "senderId"
							ELSE GREATEST("senderId", "recipientId")
						END as user_b
					`)
					)
					.where(function (this: Knex.QueryBuilder) {
						this.where('senderId', currentUserId).orWhere('recipientId', currentUserId);
					})
					.whereIn('id', function () {
						this.select(knexDb.raw('MAX("id")'))
							.from(function (this: Knex.QueryBuilder) {
								this.select(
									'id',
									'senderId',
									'recipientId',
									knexDb.raw(`
									CASE 
										WHEN "recipientId" IS NULL THEN "senderId"
										ELSE LEAST("senderId", "recipientId") 
									END as user_a
								`),
									knexDb.raw(`
									CASE 
										WHEN "recipientId" IS NULL THEN "senderId"
										ELSE GREATEST("senderId", "recipientId")
									END as user_b
								`)
								)
									.from('messages')
									.where(function (this: Knex.QueryBuilder) {
										this.where('senderId', currentUserId).orWhere('recipientId', currentUserId);
									})
									.as('grouped');
							})
							.groupBy(['user_a', 'user_b']);
					})
					.as('last_messages_base'),
				function () {
					this.on(function () {
						this.on('users.id', '=', 'last_messages_base.senderId').orOn(
							'users.id',
							'=',
							'last_messages_base.recipientId'
						);
					});
				}
			)
			.orderBy('last_messages_base.created_at', 'desc');
	};
}

export const messageRepository = new MessageRepository();
