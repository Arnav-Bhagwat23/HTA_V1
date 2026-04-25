import type { ParsedDocument } from '@hta/shared';

import type { NmaResultsRowOutput } from '../schema/nma-results.validation';
import {
  nmaResultsJsonSchema,
  nmaResultsRowSchema,
} from '../schema/nma-results.validation';
import { callOpenAIStructured } from './openai-client';

export const extractNmaResults = async (
  parsedDocument: ParsedDocument,
): Promise<NmaResultsRowOutput> => {
  const prompt = `
You are extracting network meta-analysis result data from a document.

Return JSON only.

Fields:
- comparison
- outcome
- effectMeasure
- estimate
- credibleInterval
- conclusion

Document:
${parsedDocument.rawText.slice(0, 15000)}
`;

  const response = await callOpenAIStructured(
    prompt,
    'nma_results',
    nmaResultsJsonSchema,
  );
  const parsed = JSON.parse(response);

  return nmaResultsRowSchema.parse(parsed);
};
