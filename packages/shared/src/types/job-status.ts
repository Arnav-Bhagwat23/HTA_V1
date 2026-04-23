import type { JobMode } from '../constants/job-modes';
import type { JobStatus } from '../constants/job-statuses';
import type { ISODateString, UUID } from './common';

export interface JobState {
  jobId: UUID;
  status: JobStatus;
  mode: JobMode;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
