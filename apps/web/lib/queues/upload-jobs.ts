import { Queue } from 'bullmq';

import { getRedisConnection, UPLOAD_JOBS_QUEUE } from '@hta/shared';

export const uploadJobsQueue = new Queue(UPLOAD_JOBS_QUEUE, {
  connection: getRedisConnection(),
});
