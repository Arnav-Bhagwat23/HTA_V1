import type { ParsedDocument } from '@hta/shared';

import type { GuidelineResultsRowOutput } from '../schema/guideline-results.validation';
import {
  guidelineResultsJsonSchema,
  guidelineResultsRowSchema,
} from '../schema/guideline-results.validation';
import { callOpenAIStructured } from './openai-client';

export const extractGuidelineResults = async (
  parsedDocument: ParsedDocument,
): Promise<GuidelineResultsRowOutput> => {
  const prompt = `
You are extracting guideline recommendation data from a document.

Return JSON only.

Fields:
- guidelineName
- issuingBody
- recommendation
- population
- lineOfTherapy
- notes

Document:
${parsedDocument.rawText.slice(0, 15000)}
`;

  const response = await callOpenAIStructured(
    prompt,
    'guideline_results',
    guidelineResultsJsonSchema,
  );
  const parsed = JSON.parse(response);

  return guidelineResultsRowSchema.parse(parsed);
};
