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
			throw new AppError('User ID is required', 401);
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

		const messages = await messageRepository.getAllUsersLastMessage();
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

		const messages = await messageRepository.update(messageId as string, {
			status: MessageStatus.READ,
			readAt: new Date(),
		});
		if (!messages) {
			throw new AppError('No messages found', 404);
		}

		return AppResponse(res, 200, toJSON(messages), 'All users Messages retrieved successfully');
	});
}

export const messageController = new MessageController();
