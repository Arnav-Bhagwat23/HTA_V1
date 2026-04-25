import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { buildWorkbookBuffer } from './workbook-builder';
import { WORKBOOK_SHEETS } from './workbook-schema';

describe('buildWorkbookBuffer', () => {
  it('creates all expected sheets and HTA Results headers', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      ...WORKBOOK_SHEETS,
    ]);

    const htaResultsSheet = workbook.getWorksheet('HTA Results');
    expect(htaResultsSheet).toBeDefined();
    expect(htaResultsSheet?.getRow(1).values).toEqual([
      ,
      'Drug Name',
      'Indication',
      'Country',
      'HTA Decision',
      'Decision Date',
      'Restriction Details',
    ]);

    expect(workbook.getWorksheet('Trial Results')).toBeDefined();
    expect(workbook.getWorksheet('Trial Results')?.getRow(1).values).toEqual([
      ,
      'Trial Name',
      'Phase',
      'Population',
      'Comparator',
      'Primary Endpoint',
      'Result Summary',
    ]);
    expect(workbook.getWorksheet('NMA Results')).toBeDefined();
    expect(workbook.getWorksheet('NMA Results')?.getRow(1).values).toEqual([
      ,
      'Comparison',
      'Outcome',
      'Effect Measure',
      'Estimate',
      'Credible Interval',
      'Conclusion',
    ]);
    expect(workbook.getWorksheet('Economic Evaluation')).toBeDefined();
    expect(workbook.getWorksheet('Economic Evaluation')?.getRow(1).values).toEqual([
      ,
      'Model Type',
      'Perspective',
      'Time Horizon',
      'Comparator',
      'ICER',
      'Cost-Effectiveness Conclusion',
    ]);
    expect(workbook.getWorksheet('Guideline Results')).toBeDefined();
    expect(workbook.getWorksheet('Guideline Results')?.getRow(1).values).toEqual([
      ,
      'Guideline Name',
      'Issuing Body',
      'Recommendation',
      'Population',
      'Line of Therapy',
      'Notes',
    ]);
    expect(workbook.getWorksheet('Field Provenance')).toBeDefined();
    expect(workbook.getWorksheet('Field Provenance')?.getRow(1).values).toEqual([
      ,
      'Field Name',
      'Field Label',
      'Value',
      'Confidence',
      'Warning Code',
      'Document Title',
      'Document URL',
      'Source Page',
      'Evidence Snippet',
      'Published At',
    ]);
    expect(workbook.getWorksheet('Documents Considered')).toBeDefined();
    expect(workbook.getWorksheet('Documents Considered')?.getRow(1).values).toEqual([
      ,
      'Document ID',
      'Document Title',
      'Source Name',
      'Source Type',
      'Source Country',
      'Document URL',
      'Published At',
      'Is Selected',
      'Parse Status',
      'Warning Code',
      'Warning Message',
    ]);
    expect(workbook.getWorksheet('Extraction Audit Log')).toBeDefined();
    expect(workbook.getWorksheet('Extraction Audit Log')?.getRow(1).values).toEqual([
      ,
      'Event Type',
      'Event Payload',
      'Created At',
    ]);
    expect(workbook.getWorksheet('Missing Fields & Warnings')?.getRow(1).values).toEqual([
      ,
      'Field Name',
      'Field Label',
      'Warning Code',
      'Warning Message',
      'Source',
    ]);
    expect(workbook.getWorksheet('Run Metadata')?.getRow(1).values).toEqual([
      ,
      'Job ID',
      'Mode',
      'Status',
      'Raw Query',
      'Canonical Drug',
      'Canonical Indication',
      'Canonical Geography',
      'Requires Manual Upload',
      'Created At',
      'Completed At',
    ]);
    expect(workbook.getWorksheet('Missing Fields & Warnings')).toBeDefined();
    expect(workbook.getWorksheet('Run Metadata')).toBeDefined();
    expect(workbook.getWorksheet('Source URLs')).toBeDefined();
  });

  it('writes one HTA Results row', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [
        {
          drugName: 'Mock drug',
          indication: 'General indication',
          country: 'Australia',
          htaDecision: 'Recommended',
          decisionDate: '2026-04-25',
          restrictionDetails: 'Restricted to mock criteria',
        },
      ],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const htaResultsSheet = workbook.getWorksheet('HTA Results');
    expect(htaResultsSheet?.getRow(2).values).toEqual([
      ,
      'Mock drug',
      'General indication',
      'Australia',
      'Recommended',
      '2026-04-25',
      'Restricted to mock criteria',
    ]);
  });

  it('writes one Trial Results row', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [
        {
          trialName: 'MOCK-301',
          phase: 'Phase 3',
          population: 'Adults with mock condition',
          comparator: 'Standard of care',
          primaryEndpoint: 'Progression-free survival',
          resultSummary: 'Mock drug improved the primary endpoint.',
        },
      ],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const trialResultsSheet = workbook.getWorksheet('Trial Results');
    expect(trialResultsSheet?.getRow(2).values).toEqual([
      ,
      'MOCK-301',
      'Phase 3',
      'Adults with mock condition',
      'Standard of care',
      'Progression-free survival',
      'Mock drug improved the primary endpoint.',
    ]);
  });

  it('writes one NMA Results row', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [
        {
          comparison: 'Mock drug vs standard of care',
          outcome: 'Overall survival',
          effectMeasure: 'Hazard ratio',
          estimate: '0.78',
          credibleInterval: '0.65 to 0.94',
          conclusion: 'Mock drug favored in the NMA.',
        },
      ],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const nmaResultsSheet = workbook.getWorksheet('NMA Results');
    expect(nmaResultsSheet?.getRow(2).values).toEqual([
      ,
      'Mock drug vs standard of care',
      'Overall survival',
      'Hazard ratio',
      '0.78',
      '0.65 to 0.94',
      'Mock drug favored in the NMA.',
    ]);
  });

  it('writes one Economic Evaluation row', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [
        {
          modelType: 'Partitioned survival model',
          perspective: 'Payer',
          timeHorizon: 'Lifetime',
          comparator: 'Standard of care',
          icer: '$45,000/QALY',
          costEffectivenessConclusion:
            'Considered cost-effective at current threshold.',
        },
      ],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const economicEvaluationSheet = workbook.getWorksheet('Economic Evaluation');
    expect(economicEvaluationSheet?.getRow(2).values).toEqual([
      ,
      'Partitioned survival model',
      'Payer',
      'Lifetime',
      'Standard of care',
      '$45,000/QALY',
      'Considered cost-effective at current threshold.',
    ]);
  });

  it('writes one Guideline Results row', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [
        {
          guidelineName: 'Mock Oncology Guideline 2026',
          issuingBody: 'Mock Society',
          recommendation: 'Recommended in selected patients',
          population: 'Adults with mock condition',
          lineOfTherapy: 'Second line',
          notes: 'Use after progression on first-line therapy.',
        },
      ],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const guidelineResultsSheet = workbook.getWorksheet('Guideline Results');
    expect(guidelineResultsSheet?.getRow(2).values).toEqual([
      ,
      'Mock Oncology Guideline 2026',
      'Mock Society',
      'Recommended in selected patients',
      'Adults with mock condition',
      'Second line',
      'Use after progression on first-line therapy.',
    ]);
  });

  it('writes Field Provenance rows', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [
        {
          fieldName: 'hta_decision',
          fieldLabel: 'HTA Decision',
          value: 'Recommended',
          confidence: 0.7,
          warningCode: null,
          documentTitle: 'Mock HTA Document',
          documentUrl: 'https://example.com/mock.pdf',
          sourcePage: '1',
          evidenceSnippet: 'The medicine is recommended for listing.',
          publishedAt: '2026-04-25T00:00:00.000Z',
        },
      ],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const fieldProvenanceSheet = workbook.getWorksheet('Field Provenance');
    const row = fieldProvenanceSheet?.getRow(2);

    expect(row?.getCell(1).value).toBe('hta_decision');
    expect(row?.getCell(2).value).toBe('HTA Decision');
    expect(row?.getCell(3).value).toBe('Recommended');
    expect(row?.getCell(4).value).toBe(0.7);
    expect(row?.getCell(5).value).toBeNull();
    expect(row?.getCell(6).value).toBe('Mock HTA Document');
    expect(row?.getCell(7).value).toBe('https://example.com/mock.pdf');
    expect(row?.getCell(8).value).toBe('1');
    expect(row?.getCell(9).value).toBe(
      'The medicine is recommended for listing.',
    );
    expect(row?.getCell(10).value).toBe('2026-04-25T00:00:00.000Z');
  });

  it('writes Documents Considered rows', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [
        {
          documentId: 'doc-1',
          documentTitle: 'Mock HTA Document',
          sourceName: 'PBAC',
          sourceType: 'pdf',
          sourceCountry: 'AU',
          documentUrl: 'https://example.com/mock.pdf',
          publishedAt: '2026-04-25T00:00:00.000Z',
          isSelected: true,
          parseStatus: 'PARSED',
          warningCode: null,
          warningMessage: null,
        },
      ],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const documentsConsideredSheet = workbook.getWorksheet(
      'Documents Considered',
    );
    const row = documentsConsideredSheet?.getRow(2);

    expect(row?.getCell(1).value).toBe('doc-1');
    expect(row?.getCell(2).value).toBe('Mock HTA Document');
    expect(row?.getCell(3).value).toBe('PBAC');
    expect(row?.getCell(4).value).toBe('pdf');
    expect(row?.getCell(5).value).toBe('AU');
    expect(row?.getCell(6).value).toBe('https://example.com/mock.pdf');
    expect(row?.getCell(7).value).toBe('2026-04-25T00:00:00.000Z');
    expect(row?.getCell(8).value).toBe(true);
    expect(row?.getCell(9).value).toBe('PARSED');
    expect(row?.getCell(10).value).toBeNull();
    expect(row?.getCell(11).value).toBeNull();
  });

  it('writes Extraction Audit Log rows', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [
        {
          eventType: 'job_completed',
          eventPayload: '{"status":"COMPLETED"}',
          createdAt: '2026-04-25T12:00:00.000Z',
        },
      ],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const extractionAuditLogSheet = workbook.getWorksheet('Extraction Audit Log');
    const row = extractionAuditLogSheet?.getRow(2);

    expect(row?.getCell(1).value).toBe('job_completed');
    expect(row?.getCell(2).value).toBe('{"status":"COMPLETED"}');
    expect(row?.getCell(3).value).toBe('2026-04-25T12:00:00.000Z');
  });

  it('writes Missing Fields & Warnings rows', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [
        {
          fieldName: 'hta_decision',
          fieldLabel: 'HTA Decision',
          warningCode: 'FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT',
          warningMessage: 'Decision phrase was not found in the latest document.',
          source: 'field_extraction',
        },
      ],
      nmaResults: [],
      runMetadata: [],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const missingFieldsWarningsSheet = workbook.getWorksheet(
      'Missing Fields & Warnings',
    );
    const row = missingFieldsWarningsSheet?.getRow(2);

    expect(row?.getCell(1).value).toBe('hta_decision');
    expect(row?.getCell(2).value).toBe('HTA Decision');
    expect(row?.getCell(3).value).toBe('FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT');
    expect(row?.getCell(4).value).toBe(
      'Decision phrase was not found in the latest document.',
    );
    expect(row?.getCell(5).value).toBe('field_extraction');
  });

  it('writes Run Metadata rows', async () => {
    const buffer = await buildWorkbookBuffer({
      documentsConsidered: [],
      economicEvaluation: [],
      extractionAuditLog: [],
      fieldProvenance: [],
      guidelineResults: [],
      htaResults: [],
      missingFieldsWarnings: [],
      nmaResults: [],
      runMetadata: [
        {
          jobId: 'job-123',
          mode: 'AUTOMATIC',
          status: 'COMPLETED',
          rawQuery: 'Mock drug Australia',
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'AU',
          requiresManualUpload: false,
          createdAt: '2026-04-25T12:00:00.000Z',
          completedAt: '2026-04-25T12:05:00.000Z',
        },
      ],
      trialResults: [],
    });
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const runMetadataSheet = workbook.getWorksheet('Run Metadata');
    const row = runMetadataSheet?.getRow(2);

    expect(row?.getCell(1).value).toBe('job-123');
    expect(row?.getCell(2).value).toBe('AUTOMATIC');
    expect(row?.getCell(3).value).toBe('COMPLETED');
    expect(row?.getCell(4).value).toBe('Mock drug Australia');
    expect(row?.getCell(5).value).toBe('Mock drug');
    expect(row?.getCell(6).value).toBe('General indication');
    expect(row?.getCell(7).value).toBe('AU');
    expect(row?.getCell(8).value).toBe(false);
    expect(row?.getCell(9).value).toBe('2026-04-25T12:00:00.000Z');
    expect(row?.getCell(10).value).toBe('2026-04-25T12:05:00.000Z');
  });
});
