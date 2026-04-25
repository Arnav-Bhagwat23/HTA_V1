export const WORKBOOK_SHEETS = [
  'HTA Results',
  'Trial Results',
  'NMA Results',
  'Economic Evaluation',
  'Guideline Results',
  'Field Provenance',
  'Documents Considered',
  'Extraction Audit Log',
  'Missing Fields & Warnings',
  'Run Metadata',
  'Source URLs',
] as const;

export type WorkbookSheetName = (typeof WORKBOOK_SHEETS)[number];

export interface WorkbookColumn {
  key: string;
  header: string;
}

export const WORKBOOK_COLUMNS: Record<WorkbookSheetName, WorkbookColumn[]> = {
  'HTA Results': [
    { key: 'drugName', header: 'Drug Name' },
    { key: 'indication', header: 'Indication' },
    { key: 'country', header: 'Country' },
    { key: 'htaDecision', header: 'HTA Decision' },
    { key: 'decisionDate', header: 'Decision Date' },
    { key: 'restrictionDetails', header: 'Restriction Details' },
  ],
  'Trial Results': [
    { key: 'trialName', header: 'Trial Name' },
    { key: 'phase', header: 'Phase' },
    { key: 'population', header: 'Population' },
    { key: 'comparator', header: 'Comparator' },
    { key: 'primaryEndpoint', header: 'Primary Endpoint' },
    { key: 'resultSummary', header: 'Result Summary' },
  ],
  'NMA Results': [],
  'Economic Evaluation': [],
  'Guideline Results': [],
  'Field Provenance': [],
  'Documents Considered': [],
  'Extraction Audit Log': [],
  'Missing Fields & Warnings': [],
  'Run Metadata': [],
  'Source URLs': [],
};
