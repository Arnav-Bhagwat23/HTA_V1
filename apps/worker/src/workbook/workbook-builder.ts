import ExcelJS from 'exceljs';

import type { EconomicEvaluationRow } from '../schema/economic-evaluation.schema';
import type { GuidelineResultsRow } from '../schema/guideline-results.schema';
import type { HtaResultsRow } from '../schema/hta-results.schema';
import type { NmaResultsRow } from '../schema/nma-results.schema';
import type { TrialResultsRow } from '../schema/trial-results.schema';
import { WORKBOOK_COLUMNS, WORKBOOK_SHEETS } from './workbook-schema';

export interface WorkbookBuildInput {
  economicEvaluation: EconomicEvaluationRow[];
  guidelineResults: GuidelineResultsRow[];
  htaResults: HtaResultsRow[];
  nmaResults: NmaResultsRow[];
  trialResults: TrialResultsRow[];
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

    if (sheetName === 'Trial Results') {
      for (const row of input.trialResults) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'NMA Results') {
      for (const row of input.nmaResults) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Economic Evaluation') {
      for (const row of input.economicEvaluation) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Guideline Results') {
      for (const row of input.guidelineResults) {
        worksheet.addRow(row);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
