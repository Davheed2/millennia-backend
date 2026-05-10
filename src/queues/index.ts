import { startEmailQueue, stopEmailQueue } from './emailQueue';
import { startCopyQueue, stopCopyQueue } from './copyQueue';

const startAllQueuesAndWorkers = async () => {
	await startEmailQueue();
	await startCopyQueue();
};

const stopAllQueuesAndWorkers = async () => {
	await stopEmailQueue();
	await stopCopyQueue();
};

export * from './emailQueue';
export * from './copyQueue';
export { startAllQueuesAndWorkers, stopAllQueuesAndWorkers };
