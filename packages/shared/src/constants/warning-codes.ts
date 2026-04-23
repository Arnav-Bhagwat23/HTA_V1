export const WARNING_CODES = [
  'NO_RESULT_FOUND',
  'SOURCE_UNAVAILABLE',
  'SOURCE_PARSE_FAILED',
  'PDF_CORRUPT',
  'MANUAL_UPLOAD_REQUIRED',
  'UPLOAD_PARSE_FAILED',
  'FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT',
  'CSV_GENERATION_FAILED',
  'AUTH_REQUIRED',
  'ACCESS_DENIED',
  'UNKNOWN_ERROR',
] as const;

export type WarningCode = (typeof WARNING_CODES)[number];

const WARNING_CODE_SET: ReadonlySet<string> = new Set(WARNING_CODES);

export const isWarningCode = (value: string): value is WarningCode =>
  WARNING_CODE_SET.has(value);
