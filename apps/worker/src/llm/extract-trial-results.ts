import type { ParsedDocument } from '@hta/shared';

import type { TrialResultsRowOutput } from '../schema/trial-results.validation';
import {
  trialResultsJsonSchema,
  trialResultsRowSchema,
} from '../schema/trial-results.validation';
import { callOpenAIStructured } from './openai-client';

export const extractTrialResults = async (
  parsedDocument: ParsedDocument,
): Promise<TrialResultsRowOutput> => {
  const prompt = `
You are extracting clinical trial result data from a document.

Return JSON only.

Fields:
- trialName
- phase
- population
- comparator
- primaryEndpoint
- resultSummary

Document:
${parsedDocument.rawText.slice(0, 15000)}
`;

  const response = await callOpenAIStructured(
    prompt,
    'trial_results',
    trialResultsJsonSchema,
  );
  const parsed = JSON.parse(response);

  return trialResultsRowSchema.parse(parsed);
};
