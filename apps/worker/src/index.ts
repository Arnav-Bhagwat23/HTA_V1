import { Worker } from 'bullmq';

import {
  getRedisConnection,
  SEARCH_JOBS_QUEUE,
} from '../../../../packages/shared/src';
import { processSearchJob } from './jobs/process-search.job';

const worker = new Worker(SEARCH_JOBS_QUEUE, processSearchJob, {
  connection: getRedisConnection(),
});

worker.on('completed', (job) => {
  console.log(`Completed search job ${job.id}.`);
});

worker.on('failed', (job, error) => {
  console.error(`Failed search job ${job?.id ?? 'unknown'}.`, error);
});

console.log(`Worker listening on queue: ${SEARCH_JOBS_QUEUE}`);
