import { Worker } from 'bullmq';

import {
  getRedisConnection,
  SEARCH_JOBS_QUEUE,
  UPLOAD_JOBS_QUEUE,
} from '@hta/shared';
import { processUploadJob } from './jobs/process-upload.job';
import { processSearchJob } from './jobs/process-search.job';

const searchWorker = new Worker(SEARCH_JOBS_QUEUE, processSearchJob, {
  connection: getRedisConnection(),
});

const uploadWorker = new Worker(UPLOAD_JOBS_QUEUE, processUploadJob, {
  connection: getRedisConnection(),
});

searchWorker.on('completed', (job) => {
  console.log(`Completed search job ${job.id}.`);
});

searchWorker.on('failed', (job, error) => {
  console.error(`Failed search job ${job?.id ?? 'unknown'}.`, error);
});

uploadWorker.on('completed', (job) => {
  console.log(`Completed upload job ${job.id}.`);
});

uploadWorker.on('failed', (job, error) => {
  console.error(`Failed upload job ${job?.id ?? 'unknown'}.`, error);
});

console.log(`Worker listening on queues: ${SEARCH_JOBS_QUEUE}, ${UPLOAD_JOBS_QUEUE}`);
