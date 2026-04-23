import type { JobMode } from '../constants/job-modes';
import type { JobStatus } from '../constants/job-statuses';
import type { JobPreview } from './extraction';
import type { NormalizedQuery } from './normalized-query';
import type { UUID } from './common';

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  jobId: UUID;
  status: JobStatus;
  mode: JobMode;
  normalizedQuery: NormalizedQuery | null;
}

export interface UploadFileDescriptor {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadRequest {
  jobId: UUID;
  files: UploadFileDescriptor[];
}

export interface PreviewResponse extends JobPreview {}
