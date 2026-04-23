import { Queue } from 'bullmq';

import { getRedisConnection } from '../../../../apps/worker/src/queues/connection';
import { SEARCH_JOBS_QUEUE } from '../../../../apps/worker/src/queues/queue-names';

export const searchJobsQueue = new Queue(SEARCH_JOBS_QUEUE, {
  connection: getRedisConnection(),
});
