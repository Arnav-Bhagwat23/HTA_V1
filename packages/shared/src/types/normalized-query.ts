import type { CanonicalGeography } from '../constants/countries';
import type { WarningCode } from '../constants/warning-codes';
import type { ConfidenceBreakdown } from './common';

export interface NormalizedQuery {
  rawQuery: string;
  canonicalDrug: string | null;
  canonicalIndication: string | null;
  canonicalGeography: CanonicalGeography | null;
  drugAliases: string[];
  indicationAliases: string[];
  geographyAliases: string[];
  confidence: ConfidenceBreakdown;
  requiresManualUpload: boolean;
  warnings: WarningCode[];
}
