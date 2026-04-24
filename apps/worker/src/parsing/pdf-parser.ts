import type { ParsedDocument, SelectedDocument } from '@hta/shared';

export const parsePdfDocument = async (
  selectedDocument: SelectedDocument,
): Promise<ParsedDocument> => {
  return {
    documentId: selectedDocument.documentId,
    sourceType: 'pdf',
    title: selectedDocument.title,
    publishedAt: selectedDocument.publishedAt,
    rawText: `Mock parsed PDF text for ${selectedDocument.title}`,
    metadata: {
      sourceName: selectedDocument.sourceName,
      sourceUrl: selectedDocument.sourceUrl,
      sourceCountry: selectedDocument.sourceCountry,
      parser: 'mock-pdf-parser',
    },
  };
};
