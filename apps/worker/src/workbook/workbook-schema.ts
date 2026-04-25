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
  'NMA Results': [
    { key: 'comparison', header: 'Comparison' },
    { key: 'outcome', header: 'Outcome' },
    { key: 'effectMeasure', header: 'Effect Measure' },
    { key: 'estimate', header: 'Estimate' },
    { key: 'credibleInterval', header: 'Credible Interval' },
    { key: 'conclusion', header: 'Conclusion' },
  ],
  'Economic Evaluation': [
    { key: 'modelType', header: 'Model Type' },
    { key: 'perspective', header: 'Perspective' },
    { key: 'timeHorizon', header: 'Time Horizon' },
    { key: 'comparator', header: 'Comparator' },
    { key: 'icer', header: 'ICER' },
    {
      key: 'costEffectivenessConclusion',
      header: 'Cost-Effectiveness Conclusion',
    },
  ],
  'Guideline Results': [
    { key: 'guidelineName', header: 'Guideline Name' },
    { key: 'issuingBody', header: 'Issuing Body' },
    { key: 'recommendation', header: 'Recommendation' },
    { key: 'population', header: 'Population' },
    { key: 'lineOfTherapy', header: 'Line of Therapy' },
    { key: 'notes', header: 'Notes' },
  ],
  'Field Provenance': [
    { key: 'fieldName', header: 'Field Name' },
    { key: 'fieldLabel', header: 'Field Label' },
    { key: 'value', header: 'Value' },
    { key: 'confidence', header: 'Confidence' },
    { key: 'warningCode', header: 'Warning Code' },
    { key: 'documentTitle', header: 'Document Title' },
    { key: 'documentUrl', header: 'Document URL' },
    { key: 'sourcePage', header: 'Source Page' },
    { key: 'evidenceSnippet', header: 'Evidence Snippet' },
    { key: 'publishedAt', header: 'Published At' },
  ],
  'Documents Considered': [],
  'Extraction Audit Log': [],
  'Missing Fields & Warnings': [],
  'Run Metadata': [],
  'Source URLs': [],
};
