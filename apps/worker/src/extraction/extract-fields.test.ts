import { describe, expect, it } from 'vitest';

import { extractFieldsFromParsedDocument } from './extract-fields';

describe('extractFieldsFromParsedDocument', () => {
  it('returns rule-based fields with evidence', async () => {
    const result = await extractFieldsFromParsedDocument({
      documentId: 'doc-1',
      sourceType: 'pdf',
      title: 'PBAC Public Summary Document',
      publishedAt: '2026-04-24T00:00:00.000Z',
      rawText: 'PBAC Public Summary Document. The medicine is recommended for listing.',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: 'https://example.com/pbac.pdf',
        sourceCountry: 'AU',
        parser: 'mock-pdf-parser',
      },
    });

    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe(1);
    expect(result.fields).toHaveLength(3);
    expect(result.fields[0].fieldName).toBe('source_document_title');
    expect(result.fields[1].fieldName).toBe('document_text_available');
    expect(result.fields[1].value).toBe('Yes');
    expect(result.fields[2]).toMatchObject({
      fieldName: 'hta_decision',
      value: 'Recommended',
      confidence: 0.7,
    });
    expect(result.fields[0].evidence[0]).toEqual({
      documentId: 'doc-1',
      documentTitle: 'PBAC Public Summary Document',
      documentUrl: 'https://example.com/pbac.pdf',
      sourcePage: '1',
      snippet: 'PBAC Public Summary Document. The medicine is recommended for listing.',
      publishedAt: '2026-04-24T00:00:00.000Z',
    });
    expect(result.structuredOutput.htaResults).toHaveLength(1);
    expect(result.structuredOutput.nmaResults).toEqual([
      {
        comparison: 'Mock drug vs standard of care',
        outcome: 'Overall survival',
        effectMeasure: 'Hazard ratio',
        estimate: '0.78',
        credibleInterval: '0.65 to 0.94',
        conclusion: 'Mock drug favored in the NMA.',
      },
    ]);
    expect(result.structuredOutput.economicEvaluation).toEqual([
      {
        modelType: 'Partitioned survival model',
        perspective: 'Payer',
        timeHorizon: 'Lifetime',
        comparator: 'Standard of care',
        icer: '$45,000/QALY',
        costEffectivenessConclusion:
          'Considered cost-effective at current threshold.',
      },
    ]);
    expect(result.structuredOutput.trialResults).toEqual([
      {
        trialName: 'MOCK-301',
        phase: 'Phase 3',
        population: 'Adults with mock condition',
        comparator: 'Standard of care',
        primaryEndpoint: 'Progression-free survival',
        resultSummary: 'Mock trial showed benefit in the primary endpoint.',
      },
    ]);
  });

  it('marks text as unavailable when parsed text is blank', async () => {
    const result = await extractFieldsFromParsedDocument({
      documentId: 'doc-2',
      sourceType: 'pdf',
      title: 'Blank Document',
      publishedAt: null,
      rawText: '   ',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: null,
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });

    expect(result.fields[1]).toMatchObject({
      fieldName: 'document_text_available',
      value: 'No',
      confidence: 1,
    });
    expect(result.fields[2]).toMatchObject({
      fieldName: 'hta_decision',
      value: null,
      confidence: null,
    });
    expect(result.fields[0].evidence[0].snippet).toBeNull();
    expect(result.structuredOutput.economicEvaluation).toHaveLength(1);
    expect(result.structuredOutput.nmaResults).toHaveLength(1);
    expect(result.structuredOutput.trialResults).toHaveLength(1);
  });

  it('prefers more specific negative and deferred decision phrases', async () => {
    const notRecommended = await extractFieldsFromParsedDocument({
      documentId: 'doc-3',
      sourceType: 'pdf',
      title: 'Negative Decision',
      publishedAt: null,
      rawText: 'After review, the medicine was not recommended for listing.',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: null,
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });

    const deferred = await extractFieldsFromParsedDocument({
      documentId: 'doc-4',
      sourceType: 'pdf',
      title: 'Deferred Decision',
      publishedAt: null,
      rawText: 'The committee decision was deferred pending further evidence.',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: null,
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });

    expect(notRecommended.fields[2]).toMatchObject({
      fieldName: 'hta_decision',
      value: 'Not Recommended',
      confidence: 0.7,
    });
    expect(deferred.fields[2]).toMatchObject({
      fieldName: 'hta_decision',
      value: 'Deferred',
      confidence: 0.7,
    });
  });
});
