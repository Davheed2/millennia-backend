import { Server, Socket } from 'socket.io';
import { MessageStatus, SocketEvents } from '@/common/constants';
//import { saveMessage, markMessageAsRead } from '../services/messageService';
import { logger, sendAdminNewMessageEmail, sendNewMessageEmail } from '@/common/utils';
import { messageRepository, userRepository } from '@/repository';

export const messageHandler = (io: Server, socket: Socket) => {
	const user = socket.data.user;
	const senderId = user.id;

	// Handle sending a direct message
	socket.on(SocketEvents.SEND_MESSAGE, async (data) => {
		try {
			const { content, recipientId } = data;

			if (!content) {
				return socket.emit('error', { message: 'Content is required' });
			}

			const message = await messageRepository.create({
				senderId,
				recipientId,
				content,
			});

			// Emit to recipient if connected
			const recipientSocket = Array.from(io.sockets.sockets.values()).find((s) => s.data.user?.id === recipientId);

			if (recipientSocket) {
				recipientSocket.emit(SocketEvents.MESSAGE_RECEIVED, message);
			}

			//send message to all admins if the user has a role of user
			const userRole = await userRepository.findById(senderId);
			if (userRole?.role === 'user') {
				const admins = await userRepository.findAllAdmins();
				for (const admin of admins) {
					if (admin.email && admin.firstName) {
						await sendAdminNewMessageEmail(admin.email, userRole.firstName, userRole.lastName);
					}
				}
			} else if (userRole?.role === 'admin') {
				const recipientUser = await userRepository.findById(recipientId);
				if (recipientUser?.email && recipientUser?.firstName) {
					await sendNewMessageEmail(recipientUser.email, recipientUser.firstName);
				}
			}

			// Emit back to sender for confirmation
			socket.emit(SocketEvents.MESSAGE_RECEIVED, message);
		} catch (error) {
			logger.error(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
			socket.emit('error', { message: 'Failed to send message' });
		}
	});

	// Fetch direct messages between admins and a user
	socket.on(SocketEvents.GET_MESSAGES, async ({ recipientId }) => {
		try {
			if (!recipientId) {
				return socket.emit('error', { message: 'Recipient ID is required' });
			}

			const messages = await messageRepository.getUserConversation(senderId, recipientId);
			socket.emit(SocketEvents.MESSAGE_RECEIVED, messages);
		} catch (err) {
			logger.error('Failed to fetch user messages:', err);
			socket.emit('error', { message: 'Failed to fetch user messages.' });
		}
	});

	// Mark a message as read
	socket.on(SocketEvents.MESSAGE_READ, async ({ messageId }) => {
		try {
			await messageRepository.update(messageId, { status: MessageStatus.READ, readAt: new Date() });

			const message = await getMessageById(messageId);
			if (message) {
				// Notify sender
				const senderSocket = Array.from(io.sockets.sockets.values()).find((s) => s.data.user?.id === message.senderId);

				if (senderSocket) {
					senderSocket.emit(SocketEvents.MESSAGE_READ, {
						messageId,
						readBy: senderId,
						readAt: new Date(),
					});
				}
			}
		} catch (error) {
			logger.error(`Error marking message as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
			socket.emit('error', { message: 'Failed to mark message as read' });
		}
	});

	// Typing indicators
	socket.on(SocketEvents.USER_TYPING, ({ recipientId }) => {
		const recipientSocket = Array.from(io.sockets.sockets.values()).find((s) => s.data.user?.id === recipientId);

		if (recipientSocket) {
			recipientSocket.emit(SocketEvents.USER_TYPING, { userId: senderId });
		}
	});

	socket.on(SocketEvents.USER_STOP_TYPING, ({ recipientId }) => {
		const recipientSocket = Array.from(io.sockets.sockets.values()).find((s) => s.data.user?.id === recipientId);

		if (recipientSocket) {
			recipientSocket.emit(SocketEvents.USER_STOP_TYPING, { userId: senderId });
		}
	});
};

const getMessageById = async (messageId: string) => {
	return messageRepository.findById(messageId);
};
