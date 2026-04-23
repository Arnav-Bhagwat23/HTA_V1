export const JOB_MODES = ['automatic', 'manual_upload'] as const;

export type JobMode = (typeof JOB_MODES)[number];
