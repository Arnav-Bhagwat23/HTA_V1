import type { JobMode } from '../constants/job-modes';
import type { JobStatus } from '../constants/job-statuses';
import type { ISODateString, UUID } from './common';

export interface JobStateTimestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface JobState {
  jobId: UUID;
  status: JobStatus;
  mode: JobMode;
  timestamps: JobStateTimestamps;
}
