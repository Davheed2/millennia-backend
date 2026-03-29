import { ENVIRONMENT } from '@/common/config';
import type { EmailJobData } from '@/common/interfaces';
import { logger } from '@/common/utils';
import { Job, Queue, QueueEvents, Worker, WorkerOptions } from 'bullmq';
import { sendEmail } from './handlers';
import IORedis from 'ioredis';

const connection = ENVIRONMENT.REDIS.URL.startsWith('rediss://')
	? new IORedis(ENVIRONMENT.REDIS.URL, { maxRetriesPerRequest: null, offlineQueue: false })
	: new IORedis({
			port: ENVIRONMENT.REDIS.PORT,
			host: ENVIRONMENT.REDIS.URL,
			password: ENVIRONMENT.REDIS.PASSWORD,
			maxRetriesPerRequest: null,
			//enableOfflineQueue: false,
			offlineQueue: false,
		});

if (connection) {
	console.log('Connected to queue redis cluster');
}

// Create a new connection in every node instance
const emailQueue = new Queue<EmailJobData>('emailQueue', {
	connection,
	defaultJobOptions: {
		attempts: 5,
		backoff: {
			type: 'exponential',
			delay: 5000,
		},
	},
});

const addEmailToQueue = async (opts: EmailJobData) => {
	const { type, data } = opts;
	try {
		await emailQueue.add(type, opts, {
			...(data.priority !== 'high' && { priority: 2 }),
		});
	} catch (error) {
		console.error('Error enqueueing email job:', error);
		logger.error('Error enqueueing email job:', error);
		throw error;
	}
};

export const resetEmailQueue = async () => {
	try {
		console.info('Resetting email queue...');
		await emailQueue.obliterate({ force: true });
		console.info('Email queue reset successfully.');
	} catch (error) {
		console.error('Failed to reset email queue:', error);
	}
};

const workerOptions: WorkerOptions = {
	connection,
	limiter: { max: 1, duration: 1000 }, // process 1 email every second due to rate limiting of email sender
	lockDuration: 5000, // 5 seconds to process the job before it can be picked up by another worker
	removeOnComplete: {
		age: 3600, // keep up to 1 hour
		count: 1000, // keep up to 1000 jobs
	},
	removeOnFail: {
		age: 24 * 3600, // keep up to 24 hours
	},
	// concurrency: 5, // process 5 jobs concurrently
};

// create a worker to process jobs from the email queue
const emailWorker = new Worker<EmailJobData>(
	'emailQueue',
	async (job: Job<EmailJobData>) => {
		try {
			await sendEmail(job);
		} catch (error) {
			console.error('Error sending email:', error);
			throw new Error('Failed to send email'); // Throwing error triggers a retry
		}
	},
	workerOptions
);

// EVENT LISTENERS
// create a queue event listener
const emailQueueEvent = new QueueEvents('emailQueue', { connection });

emailQueueEvent.on('failed', ({ jobId, failedReason }) => {
	console.log(`Job ${jobId} failed with error ${failedReason}`);
	logger.error(`Job ${jobId} failed with error ${failedReason}`);
	// Do something with the return value of failed job
});

emailQueueEvent.on('waiting', ({ jobId }) => {
	console.log(`A job with ID ${jobId} is waiting`);
});

emailQueueEvent.on('completed', ({ jobId, returnvalue }) => {
	console.log(`Job ${jobId} completed`, returnvalue);
	logger.info(`Job ${jobId} completed`, returnvalue);
	// Called every time a job is completed in any worker
});

emailWorker.on('error', (err) => {
	// log the error
	console.error(err);
	logger.error(`Error processing email job: ${err}`);
});

// TODO: Implement RETRY logic for failed or stalled jobs

const startEmailQueue = async () => {
	await emailQueue.waitUntilReady();
	await emailWorker.waitUntilReady();
	await emailQueueEvent.waitUntilReady();
	console.info('Email queue and worker are ready.');
};

const stopEmailQueue = async () => {
	await emailWorker.close();
	await emailQueue.close();
	console.info('Email queue closed!');
};

export { addEmailToQueue, emailQueue, emailQueueEvent, emailWorker, startEmailQueue, stopEmailQueue };
