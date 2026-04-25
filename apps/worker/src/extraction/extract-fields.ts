import type { ExtractionResult, ParsedDocument } from '@hta/shared';

import { extractEconomicEvaluation } from '../llm/extract-economic-evaluation';
import { extractHtaResults } from '../llm/extract-hta-results';
import { extractNmaResults } from '../llm/extract-nma-results';
import { extractTrialResults } from '../llm/extract-trial-results';
import type { StructuredExtractionOutput } from './structured-extraction-artifact';

export interface StructuredExtractionResult extends ExtractionResult {
  structuredOutput: StructuredExtractionOutput;
}

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

const buildEvidence = (parsedDocument: ParsedDocument) => {
  const trimmedText = parsedDocument.rawText.trim();
  const hasParsedText = trimmedText.length > 0;
  const snippet = hasParsedText ? trimmedText.slice(0, 200) : null;

  return {
    evidence: [
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
    ],
    hasParsedText,
  };
};

export const extractFieldsFromParsedDocument = async (
  parsedDocument: ParsedDocument,
): Promise<StructuredExtractionResult> => {
  const { evidence, hasParsedText } = buildEvidence(parsedDocument);
  const fallbackDecisionValue = extractDecisionValue(parsedDocument.rawText);

  let economicEvaluation = [] as StructuredExtractionOutput['economicEvaluation'];
  let llmDecisionValue: string | null = null;
  let htaResults = [] as StructuredExtractionOutput['htaResults'];
  let nmaResults = [] as StructuredExtractionOutput['nmaResults'];
  let trialResults = [] as StructuredExtractionOutput['trialResults'];

  try {
    const economicEvaluationResult = await extractEconomicEvaluation(
      parsedDocument,
    );
    economicEvaluation = [economicEvaluationResult];
  } catch {
    economicEvaluation = [];
  }

  try {
    const llmResult = await extractHtaResults(parsedDocument);
    llmDecisionValue = llmResult.htaDecision;
    htaResults = [llmResult];
  } catch {
    llmDecisionValue = null;
  }

  try {
    const nmaResult = await extractNmaResults(parsedDocument);
    nmaResults = [nmaResult];
  } catch {
    nmaResults = [];
  }

  try {
    const trialResult = await extractTrialResults(parsedDocument);
    trialResults = [trialResult];
  } catch {
    trialResults = [];
  }

  const decisionValue = llmDecisionValue ?? fallbackDecisionValue;

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
        confidence: decisionValue
          ? llmDecisionValue
            ? 0.8
            : 0.7
          : null,
        warningCodes: [],
        evidence,
      },
    ],
    warnings: [],
    confidence: 1,
    structuredOutput: {
      economicEvaluation,
      htaResults,
      nmaResults,
      trialResults,
    },
  };
};
