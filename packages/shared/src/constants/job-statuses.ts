export const JOB_STATUSES = [
  'queued',
  'running',
  'completed',
  'partial',
  'failed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const TERMINAL_JOB_STATUSES = [
  'completed',
  'partial',
  'failed',
] as const satisfies readonly JobStatus[];

export type TerminalJobStatus = (typeof TERMINAL_JOB_STATUSES)[number];

const JOB_STATUS_SET: ReadonlySet<string> = new Set(JOB_STATUSES);
const TERMINAL_JOB_STATUS_SET: ReadonlySet<string> = new Set(
  TERMINAL_JOB_STATUSES,
);

export const isJobStatus = (value: string): value is JobStatus =>
  JOB_STATUS_SET.has(value);

export const isTerminalJobStatus = (
  value: string,
): value is TerminalJobStatus => TERMINAL_JOB_STATUS_SET.has(value);
