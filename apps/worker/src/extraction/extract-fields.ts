import type { ExtractionResult, ParsedDocument } from '@hta/shared';

const extractDecisionValue = (rawText: string): string | null => {
  if (/\bnot recommended\b/i.test(rawText)) {
    return 'Not Recommended';
  }

  if (/\bdeferred\b/i.test(rawText)) {
    return 'Deferred';
  }

  if (/\brecommended\b/i.test(rawText)) {
    return 'Recommended';
  }

  return null;
};

export const extractFieldsFromParsedDocument = async (
  parsedDocument: ParsedDocument,
): Promise<ExtractionResult> => {
  const trimmedText = parsedDocument.rawText.trim();
  const hasParsedText = trimmedText.length > 0;
  const snippet = hasParsedText ? trimmedText.slice(0, 200) : null;
  const decisionValue = extractDecisionValue(parsedDocument.rawText);
  const evidence = [
    {
      documentId: parsedDocument.documentId,
      documentTitle: parsedDocument.title,
      documentUrl:
        typeof parsedDocument.metadata.sourceUrl === 'string'
          ? parsedDocument.metadata.sourceUrl
          : null,
      sourcePage: '1',
      snippet,
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
        fieldName: 'document_text_available',
        fieldLabel: 'Document Text Available',
        value: hasParsedText ? 'Yes' : 'No',
        confidence: 1,
        warningCodes: [],
        evidence,
      },
      {
        fieldName: 'hta_decision',
        fieldLabel: 'HTA Decision',
        value: decisionValue,
        confidence: decisionValue ? 0.7 : null,
        warningCodes: [],
        evidence,
      },
    ],
    warnings: [],
    confidence: 1,
  };
};
