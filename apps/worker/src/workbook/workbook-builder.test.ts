import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { buildWorkbookBuffer } from './workbook-builder';
import { WORKBOOK_SHEETS } from './workbook-schema';

describe('buildWorkbookBuffer', () => {
  it('creates all expected sheets and HTA Results headers', async () => {
    const buffer = await buildWorkbookBuffer();
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
});
