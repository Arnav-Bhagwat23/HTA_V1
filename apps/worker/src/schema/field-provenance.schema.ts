export interface FieldProvenanceRow {
  fieldName: string;
  fieldLabel: string;
  value: string | null;
  confidence: number | null;
  warningCode: string | null;
  documentTitle: string | null;
  documentUrl: string | null;
  sourcePage: string | null;
  evidenceSnippet: string | null;
  publishedAt: string | null;
}
