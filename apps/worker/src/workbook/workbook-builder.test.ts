import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { buildWorkbookBuffer } from './workbook-builder';
import { WORKBOOK_SHEETS } from './workbook-schema';

describe('buildWorkbookBuffer', () => {
  it('creates all expected sheets and HTA Results headers', async () => {
    const buffer = await buildWorkbookBuffer({
      htaResults: [],
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
    expect(workbook.getWorksheet('Economic Evaluation')).toBeDefined();
    expect(workbook.getWorksheet('Guideline Results')).toBeDefined();
    expect(workbook.getWorksheet('Field Provenance')).toBeDefined();
    expect(workbook.getWorksheet('Documents Considered')).toBeDefined();
    expect(workbook.getWorksheet('Extraction Audit Log')).toBeDefined();
    expect(workbook.getWorksheet('Missing Fields & Warnings')).toBeDefined();
    expect(workbook.getWorksheet('Run Metadata')).toBeDefined();
    expect(workbook.getWorksheet('Source URLs')).toBeDefined();
  });

  it('writes one HTA Results row', async () => {
    const buffer = await buildWorkbookBuffer({
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
      htaResults: [],
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
});
