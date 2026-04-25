export interface DocumentsConsideredRow {
  documentId: string;
  documentTitle: string | null;
  sourceName: string | null;
  sourceType: string;
  sourceCountry: string | null;
  documentUrl: string | null;
  publishedAt: string | null;
  isSelected: boolean;
  parseStatus: string | null;
  warningCode: string | null;
  warningMessage: string | null;
}
