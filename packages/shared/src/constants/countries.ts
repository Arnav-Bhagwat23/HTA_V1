export const SUPPORTED_AUTOMATIC_COUNTRIES = [
  'DE',
  'FR',
  'UK',
  'IT',
  'AU',
  'ES',
  'JP',
] as const;

export const MANUAL_ONLY_COUNTRY = 'OTHER' as const;

export const ALL_COUNTRIES = [
  ...SUPPORTED_AUTOMATIC_COUNTRIES,
  MANUAL_ONLY_COUNTRY,
] as const;

export type SupportedAutomaticCountry =
  (typeof SUPPORTED_AUTOMATIC_COUNTRIES)[number];

export type CanonicalGeography = (typeof ALL_COUNTRIES)[number];

const SUPPORTED_AUTOMATIC_COUNTRY_SET: ReadonlySet<string> = new Set(
  SUPPORTED_AUTOMATIC_COUNTRIES,
);

const CANONICAL_GEOGRAPHY_SET: ReadonlySet<string> = new Set(ALL_COUNTRIES);

export const isSupportedAutomaticCountry = (
  value: string,
): value is SupportedAutomaticCountry =>
  SUPPORTED_AUTOMATIC_COUNTRY_SET.has(value);

export const isCanonicalGeography = (
  value: string,
): value is CanonicalGeography =>
  CANONICAL_GEOGRAPHY_SET.has(value);

export const requiresManualUploadForGeography = (
  geography: CanonicalGeography | null,
): boolean => geography === MANUAL_ONLY_COUNTRY;
