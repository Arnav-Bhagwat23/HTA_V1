export const JOB_MODES = ['automatic', 'manual_upload'] as const;

export type JobMode = (typeof JOB_MODES)[number];

const JOB_MODE_SET: ReadonlySet<string> = new Set(JOB_MODES);

export const isJobMode = (value: string): value is JobMode =>
  JOB_MODE_SET.has(value);
