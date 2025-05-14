import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { messageRepository } from '@/repository';
import { MessageStatus } from '@/common/constants';

export class MessageController {
	getMessagesByUser = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const messages = await messageRepository.getUserConversation(user.id, user.id);
		if (!messages) {
			throw new AppError('No messages found', 404);
		}

		return AppResponse(res, 200, toJSON(messages), 'Messages retrieved successfully');
	});

	getMessagesByAdmin = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { userId } = req.query;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!userId) {
			throw new AppError('User ID is required', 400);
		}

		const messages = await messageRepository.getUserConversation(userId as string, userId as string);
		if (!messages) {
			throw new AppError('No messages found', 404);
		}

		return AppResponse(res, 200, toJSON(messages), 'Messages retrieved successfully');
	});

	getAllUsersWithLastMessages = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (user.role !== 'admin') {
			throw new AppError('Unauthorized access', 401);
		}

		const messages = await messageRepository.getAllUsersLastMessage(user.id);
		if (!messages) {
			throw new AppError('No messages found', 404);
		}

		return AppResponse(res, 200, toJSON(messages), 'All users Messages retrieved successfully');
	});

	readMessage = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { messageId } = req.query;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!messageId) {
			throw new AppError('Message ID is required', 401);
		}

		const message = await messageRepository.findById(messageId as string);
		if (!message) {
			throw new AppError('Message not found', 404);
		}

		if (message.recipientId !== user.id) {
			throw new AppError('Unauthorized to mark this message as read', 403);
		}

		if (message.status === MessageStatus.READ) {
			return AppResponse(res, 200, toJSON(message), 'Message already marked as read');
		}

		const updatedMessage = await messageRepository.update(messageId as string, {
			status: MessageStatus.READ,
			readAt: new Date(),
		});

		if (!updatedMessage) {
			throw new AppError('Failed to update message', 500);
		}

		return AppResponse(res, 200, toJSON(updatedMessage), 'Message marked as read successfully');
	});
}

export const messageController = new MessageController();
