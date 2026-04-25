import type { NormalizedQuery } from '@hta/shared';

import {
  normalizedQueryJsonSchema,
  normalizedQuerySchema,
} from '../schema/normalized-query.validation';
import { callOpenAIStructured } from './openai-client';

export const normalizeQueryWithLlm = async (
  rawQuery: string,
): Promise<NormalizedQuery> => {
  const prompt = `
You are normalizing an HTA search query.

Return structured JSON only.

Extract:
- canonicalDrug
- canonicalIndication
- canonicalGeography
- drugAliases
- indicationAliases
- geographyAliases
- confidence
- requiresManualUpload
- warnings

Rules:
- canonicalGeography must be one of: AU, UK, DE, FR, IT, ES, JP, OTHER, or null
- preserve the trimmed rawQuery
- if geography is unsupported, set canonicalGeography to OTHER
- confidence values must be numbers between 0 and 1

Query:
${rawQuery}
`;

  const response = await callOpenAIStructured(
    prompt,
    'normalized_query',
    normalizedQueryJsonSchema,
  );

  const parsed = JSON.parse(response);

  return normalizedQuerySchema.parse(parsed);
};
