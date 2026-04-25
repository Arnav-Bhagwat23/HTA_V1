import ExcelJS from 'exceljs';

import type { HtaResultsRow } from '../schema/hta-results.schema';
import { WORKBOOK_COLUMNS, WORKBOOK_SHEETS } from './workbook-schema';

export interface WorkbookBuildInput {
  htaResults: HtaResultsRow[];
}

export const buildWorkbookBuffer = async (
  input: WorkbookBuildInput,
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();

  for (const sheetName of WORKBOOK_SHEETS) {
    const worksheet = workbook.addWorksheet(sheetName);
    const columns = WORKBOOK_COLUMNS[sheetName];

    worksheet.columns = columns.map((column) => ({
      key: column.key,
      header: column.header,
    }));

    if (sheetName === 'HTA Results') {
      for (const row of input.htaResults) {
        worksheet.addRow(row);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
