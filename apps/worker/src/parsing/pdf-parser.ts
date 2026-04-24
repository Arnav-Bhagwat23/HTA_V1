import type { ParsedDocument, SelectedDocument } from '@hta/shared';

const getPdfParserMode = (): string =>
  process.env.PDF_PARSER_MODE?.trim() || 'mock';

const buildMockParsedDocument = (
  selectedDocument: SelectedDocument,
): ParsedDocument => {
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

export const parsePdfBuffer = async (
  _pdfBuffer: Uint8Array,
  _selectedDocument: SelectedDocument,
): Promise<ParsedDocument> => {
  throw new Error('PDF parser live mode is not implemented yet.');
};

export const parsePdfDocument = async (
  selectedDocument: SelectedDocument,
): Promise<ParsedDocument> => {
  const mode = getPdfParserMode();

  if (mode === 'mock') {
    return buildMockParsedDocument(selectedDocument);
  }

  if (mode === 'live') {
    return parsePdfBuffer(new Uint8Array(), selectedDocument);
  }

  throw new Error('PDF parser mode is not implemented yet.');
};
