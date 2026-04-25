export interface MissingFieldsWarningsRow {
  fieldName: string | null;
  fieldLabel: string | null;
  warningCode: string;
  warningMessage: string | null;
  source: string;
}
