export const JOB_STATUSES = [
  'queued',
  'running',
  'completed',
  'partial',
  'failed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
