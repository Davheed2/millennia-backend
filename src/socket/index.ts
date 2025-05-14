import { Server as SocketIOServer } from 'socket.io';
import { SocketEvents } from '@/common/constants';
import { messageHandler } from './handlers/messageHandler';
import { logger } from '@/common/utils';

// Global map to track online users
export const onlineUsers = new Map();

export const initSocketHandlers = (io: SocketIOServer) => {
	io.on(SocketEvents.CONNECT, async (socket) => {
		const user = socket.data.user;

		if (!user || !user.id) {
			logger.error('User data is missing or invalid.');
			return;
		}

		logger.info(`User connected: ${user.id}`);

		// Track online user
		onlineUsers.set(user.id, {
			socketId: socket.id,
			lastSeen: new Date(),
		});

		// Initialize handlers
		messageHandler(io, socket);

		// Handle disconnect
		socket.on(SocketEvents.DISCONNECT, () => {
			logger.info(`User disconnected: ${user.id}`);
			onlineUsers.delete(user.id);
			socket.broadcast.emit(SocketEvents.USER_OFFLINE, { userId: user.id });
		});
	});

	// Handle authentication errors
	io.on('connect_error', (err) => {
		logger.error(`Socket connection error: ${err.message}`);
	});

	return io;
};
