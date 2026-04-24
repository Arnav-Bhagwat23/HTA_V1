import type { ParsedDocument, SelectedDocument } from '@hta/shared';

import { fetchBinary } from '../retrieval/http-client';

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
    if (!selectedDocument.sourceUrl) {
      throw new Error('PDF parser live mode requires selectedDocument.sourceUrl.');
    }

    const pdfBytes = await fetchBinary(selectedDocument.sourceUrl);
    return parsePdfBuffer(pdfBytes, selectedDocument);
  }

  throw new Error('PDF parser mode is not implemented yet.');
};
