export interface RunMetadataRow {
  jobId: string;
  mode: string;
  status: string;
  rawQuery: string | null;
  canonicalDrug: string | null;
  canonicalIndication: string | null;
  canonicalGeography: string | null;
  requiresManualUpload: boolean;
  createdAt: string;
  completedAt: string | null;
}
