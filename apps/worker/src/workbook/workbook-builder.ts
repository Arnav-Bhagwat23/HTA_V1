import ExcelJS from 'exceljs';

import type { DocumentsConsideredRow } from '../schema/documents-considered.schema';
import type { EconomicEvaluationRow } from '../schema/economic-evaluation.schema';
import type { ExtractionAuditLogRow } from '../schema/extraction-audit-log.schema';
import type { FieldProvenanceRow } from '../schema/field-provenance.schema';
import type { GuidelineResultsRow } from '../schema/guideline-results.schema';
import type { HtaResultsRow } from '../schema/hta-results.schema';
import type { MissingFieldsWarningsRow } from '../schema/missing-fields-warnings.schema';
import type { NmaResultsRow } from '../schema/nma-results.schema';
import type { RunMetadataRow } from '../schema/run-metadata.schema';
import type { TrialResultsRow } from '../schema/trial-results.schema';
import { WORKBOOK_COLUMNS, WORKBOOK_SHEETS } from './workbook-schema';

export interface WorkbookBuildInput {
  documentsConsidered: DocumentsConsideredRow[];
  economicEvaluation: EconomicEvaluationRow[];
  extractionAuditLog: ExtractionAuditLogRow[];
  fieldProvenance: FieldProvenanceRow[];
  guidelineResults: GuidelineResultsRow[];
  htaResults: HtaResultsRow[];
  missingFieldsWarnings: MissingFieldsWarningsRow[];
  nmaResults: NmaResultsRow[];
  runMetadata: RunMetadataRow[];
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

    if (sheetName === 'Field Provenance') {
      for (const row of input.fieldProvenance) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Documents Considered') {
      for (const row of input.documentsConsidered) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Extraction Audit Log') {
      for (const row of input.extractionAuditLog) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Missing Fields & Warnings') {
      for (const row of input.missingFieldsWarnings) {
        worksheet.addRow(row);
      }
    }

    if (sheetName === 'Run Metadata') {
      for (const row of input.runMetadata) {
        worksheet.addRow(row);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
