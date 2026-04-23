import { Queue } from 'bullmq';

import { getRedisConnection, SEARCH_JOBS_QUEUE } from '@hta/shared';

export const searchJobsQueue = new Queue(SEARCH_JOBS_QUEUE, {
  connection: getRedisConnection(),
});
