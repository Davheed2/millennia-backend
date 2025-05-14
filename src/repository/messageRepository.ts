import { knexDb } from '@/common/config';
import { IMessage } from '@/common/interfaces';
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

	getAllUsersLastMessage = async () => {
		return await knexDb
			.select('users.id', 'users.firstName', 'users.lastName', 'users.phone', 'messages.content', 'messages.created_at')
			.from('users')
			.leftJoin(
				knexDb
					.select('*')
					.from('messages')
					.whereRaw(
						`messages.created_at IN (
						SELECT MAX(created_at)
						FROM messages m2
						WHERE m2.senderId = messages.senderId OR m2.recipientId = messages.recipientId
					)`
					)
					.as('messages'),
				function () {
					this.on('users.id', '=', 'messages.senderId').orOn('users.id', '=', 'messages.recipientId');
				}
			)
			.orderBy('messages.created_at', 'desc');
	};
	//get the last message
	// getAllMessages = async ():

	// getMessagesByUserId = async (userId: string)

	//delete read messages after 2 days, i think a cron job will do
	//deleteRead;
}

export const messageRepository = new MessageRepository();
