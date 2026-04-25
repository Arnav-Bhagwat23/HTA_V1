import type { CanonicalGeography, NormalizedQuery } from '@hta/shared';
import { requiresManualUploadForGeography } from '@hta/shared';

import { normalizeQueryWithLlm } from '../llm/normalize-query-with-llm';

interface GeographyMatcher {
  geography: CanonicalGeography;
  aliases: string[];
}

const SUPPORTED_GEOGRAPHY_MATCHERS: GeographyMatcher[] = [
  { geography: 'UK', aliases: ['uk', 'united kingdom', 'britain', 'great britain'] },
  { geography: 'DE', aliases: ['germany', 'german'] },
  { geography: 'FR', aliases: ['france', 'french'] },
  { geography: 'IT', aliases: ['italy', 'italian'] },
  { geography: 'AU', aliases: ['aus', 'australia', 'australian'] },
  { geography: 'ES', aliases: ['spain', 'spanish'] },
  { geography: 'JP', aliases: ['jp', 'japan', 'japanese'] },
];

const UNSUPPORTED_GEOGRAPHY_ALIASES = [
  'united states',
  'usa',
  'canada',
  'china',
  'india',
  'brazil',
  'netherlands',
  'sweden',
  'norway',
  'denmark',
  'belgium',
  'switzerland',
];

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAliasRegex = (alias: string): RegExp =>
  new RegExp(`(^|[^a-z])${escapeRegex(alias.toLowerCase())}([^a-z]|$)`, 'i');

const detectGeographyMatches = (
  normalizedRawQuery: string,
): Array<{ geography: CanonicalGeography; alias: string }> => {
  const matches: Array<{ geography: CanonicalGeography; alias: string }> = [];

  for (const matcher of SUPPORTED_GEOGRAPHY_MATCHERS) {
    for (const alias of matcher.aliases) {
      if (buildAliasRegex(alias).test(normalizedRawQuery)) {
        matches.push({ geography: matcher.geography, alias });
        break;
      }
    }
  }

  for (const alias of UNSUPPORTED_GEOGRAPHY_ALIASES) {
    if (buildAliasRegex(alias).test(normalizedRawQuery)) {
      matches.push({ geography: 'OTHER', alias });
      break;
    }
  }

  return matches;
};

export const normalizeQuery = (rawQuery: string): NormalizedQuery => {
  const normalizedRawQuery = rawQuery.trim();
  const lowercaseQuery = normalizedRawQuery.toLowerCase();
  const geographyMatches = detectGeographyMatches(lowercaseQuery);
  const distinctGeographies = [...new Set(geographyMatches.map((match) => match.geography))];

  const canonicalGeography =
    distinctGeographies.length === 1 ? distinctGeographies[0] : null;
  const warnings: NormalizedQuery['warnings'] =
    distinctGeographies.length > 1 ? ['GEOGRAPHY_AMBIGUOUS'] : [];

  return {
    rawQuery: normalizedRawQuery,
    canonicalDrug: null,
    canonicalIndication: null,
    canonicalGeography,
    drugAliases: [],
    indicationAliases: [],
    geographyAliases: geographyMatches.map((match) => match.alias),
    confidence: {
      drug: 0,
      indication: 0,
      geography: canonicalGeography ? 1 : 0,
    },
    requiresManualUpload: requiresManualUploadForGeography(canonicalGeography),
    warnings,
  };
};

export const normalizeQueryWithFallback = async (
  rawQuery: string,
): Promise<NormalizedQuery> => {
  try {
    return await normalizeQueryWithLlm(rawQuery);
  } catch {
    return normalizeQuery(rawQuery);
  }
};
