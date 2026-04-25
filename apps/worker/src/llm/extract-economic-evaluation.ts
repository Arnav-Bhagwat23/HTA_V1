import type { ParsedDocument } from '@hta/shared';

import type { EconomicEvaluationRowOutput } from '../schema/economic-evaluation.validation';
import {
  economicEvaluationJsonSchema,
  economicEvaluationRowSchema,
} from '../schema/economic-evaluation.validation';
import { callOpenAIStructured } from './openai-client';

export const extractEconomicEvaluation = async (
  parsedDocument: ParsedDocument,
): Promise<EconomicEvaluationRowOutput> => {
  const prompt = `
You are extracting economic evaluation data from a document.

Return JSON only.

Fields:
- modelType
- perspective
- timeHorizon
- comparator
- icer
- costEffectivenessConclusion

Document:
${parsedDocument.rawText.slice(0, 15000)}
`;

  const response = await callOpenAIStructured(
    prompt,
    'economic_evaluation',
    economicEvaluationJsonSchema,
  );
  const parsed = JSON.parse(response);

  return economicEvaluationRowSchema.parse(parsed);
};
