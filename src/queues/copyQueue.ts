import { ENVIRONMENT } from '@/common/config';
import { logger } from '@/common/utils';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { handleCopyOpen, handleCopyClose } from './handlers';

const redisRequiresTls = ENVIRONMENT.REDIS.URL.startsWith('rediss://') || ENVIRONMENT.REDIS.URL.includes('upstash.io');
const connection = redisRequiresTls
	? new IORedis({
			port: ENVIRONMENT.REDIS.PORT,
			host: ENVIRONMENT.REDIS.URL,
			password: ENVIRONMENT.REDIS.PASSWORD,
			maxRetriesPerRequest: null,
			offlineQueue: false,
			tls: {},
		})
	: new IORedis({
			port: ENVIRONMENT.REDIS.PORT,
			host: ENVIRONMENT.REDIS.URL,
			password: ENVIRONMENT.REDIS.PASSWORD,
			maxRetriesPerRequest: null,
			offlineQueue: false,
		});

// Queues
const copyQueue = new Queue('copyQueue', {
	connection,
	defaultJobOptions: {
		attempts: 3,
		backoff: { type: 'exponential', delay: 1000 },
	},
});

// Workers
const copyWorker = new Worker(
	'copyQueue',
	async (job: Job) => {
		const { type, data } = job.data;
		try {
			if (type === 'OPEN_TRADE') {
				await handleCopyOpen(data);
			} else if (type === 'CLOSE_TRADE') {
				await handleCopyClose(data);
			}
		} catch (error) {
			logger.error(`Error processing copy job ${job.id}:`, error);
			throw error;
		}
	},
	{ connection, concurrency: 5 }
);

export const addCopyJob = async (type: 'OPEN_TRADE' | 'CLOSE_TRADE', data: any) => {
	await copyQueue.add(type, { type, data });
};

export const startCopyQueue = async () => {
	await copyQueue.waitUntilReady();
	await copyWorker.waitUntilReady();
	console.info('Copy trading queue and worker are ready.');
};

export const stopCopyQueue = async () => {
	await copyWorker.close();
	await copyQueue.close();
};

export { copyQueue, copyWorker };
