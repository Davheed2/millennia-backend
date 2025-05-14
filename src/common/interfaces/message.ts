import { MessageStatus } from '../constants';

export interface IMessage {
	id: number;
	senderId: string;
	recipientId: string | null;
	content: string;
	status: MessageStatus;
	readAt: Date;
	created_at: Date;
	updated_at: Date;
}
