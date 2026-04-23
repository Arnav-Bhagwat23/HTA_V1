import type { JobMode } from '../constants/job-modes';
import type { JobStatus } from '../constants/job-statuses';
import type { WarningCode } from '../constants/warning-codes';
import type { ConfidenceScore, ISODateString, UUID } from './common';

export interface EvidenceReference {
  documentId: UUID;
  documentTitle: string | null;
  documentUrl: string | null;
  sourcePage: string | null;
  snippet: string | null;
  publishedAt: ISODateString | null;
}

export interface ExtractedField {
  fieldName: string;
  fieldLabel: string;
  value: string | null;
  confidence: ConfidenceScore | null;
  warningCodes: WarningCode[];
  evidence: EvidenceReference[];
}

export interface ExtractionResult {
  fields: ExtractedField[];
  warnings: WarningCode[];
  confidence: ConfidenceScore;
}

export interface JobPreview {
  jobId: UUID;
  status: JobStatus;
  mode: JobMode;
  fields: ExtractedField[];
  warnings: WarningCode[];
  downloadable: boolean;
}

export type CsvCell = string | number | null;

export interface CsvRow {
  [columnName: string]: CsvCell;
}
