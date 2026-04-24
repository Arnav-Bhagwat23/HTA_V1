import type { ExtractionResult, ParsedDocument } from '@hta/shared';

export const extractFieldsFromParsedDocument = async (
  parsedDocument: ParsedDocument,
): Promise<ExtractionResult> => {
  const evidence = [
    {
      documentId: parsedDocument.documentId,
      documentTitle: parsedDocument.title,
      documentUrl:
        typeof parsedDocument.metadata.sourceUrl === 'string'
          ? parsedDocument.metadata.sourceUrl
          : null,
      sourcePage: '1',
      snippet: parsedDocument.rawText.slice(0, 200),
      publishedAt: parsedDocument.publishedAt,
    },
  ];

  return {
    fields: [
      {
        fieldName: 'source_document_title',
        fieldLabel: 'Source Document Title',
        value: parsedDocument.title,
        confidence: 1,
        warningCodes: [],
        evidence,
      },
      {
        fieldName: 'hta_decision',
        fieldLabel: 'HTA Decision',
        value: `Mock extraction pending real parser. Parsed text length: ${parsedDocument.rawText.length}`,
        confidence: 0.1,
        warningCodes: [],
        evidence,
      },
    ],
    warnings: [],
    confidence: 0.55,
  };
};
