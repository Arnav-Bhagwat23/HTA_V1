import { SourceType } from '@prisma/client';
import type {
  CanonicalGeography,
  SupportedAutomaticCountry,
} from '@hta/shared';
import { isSupportedAutomaticCountry } from '@hta/shared';

export interface RoutedSourcePlan {
  sourceKey: string;
  sourceLabel: string;
  sourceCountry: SupportedAutomaticCountry;
  sourceType: SourceType;
}

const SOURCE_PLAN_BY_COUNTRY: Record<
  SupportedAutomaticCountry,
  RoutedSourcePlan
> = {
  UK: {
    sourceKey: 'nice',
    sourceLabel: 'NICE',
    sourceCountry: 'UK',
    sourceType: SourceType.HTML,
  },
  DE: {
    sourceKey: 'gba',
    sourceLabel: 'G-BA',
    sourceCountry: 'DE',
    sourceType: SourceType.HTML,
  },
  FR: {
    sourceKey: 'has',
    sourceLabel: 'HAS',
    sourceCountry: 'FR',
    sourceType: SourceType.HTML,
  },
  IT: {
    sourceKey: 'aifa',
    sourceLabel: 'AIFA',
    sourceCountry: 'IT',
    sourceType: SourceType.HTML,
  },
  AU: {
    sourceKey: 'pbac',
    sourceLabel: 'PBAC',
    sourceCountry: 'AU',
    sourceType: SourceType.PDF,
  },
  ES: {
    sourceKey: 'aemps',
    sourceLabel: 'AEMPS',
    sourceCountry: 'ES',
    sourceType: SourceType.HTML,
  },
  JP: {
    sourceKey: 'japan',
    sourceLabel: 'Japan HTA',
    sourceCountry: 'JP',
    sourceType: SourceType.HTML,
  },
};

export const routeSourcePlans = (
  canonicalGeography: CanonicalGeography | null,
): RoutedSourcePlan[] => {
  if (!canonicalGeography || !isSupportedAutomaticCountry(canonicalGeography)) {
    return [];
  }

  return [SOURCE_PLAN_BY_COUNTRY[canonicalGeography]];
};
