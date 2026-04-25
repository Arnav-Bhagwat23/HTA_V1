import type { ParsedDocument } from '@hta/shared';

import type { HtaResultsRowOutput } from '../schema/hta-results.validation';
import { htaResultsRowSchema } from '../schema/hta-results.validation';
import { callOpenAI } from './openai-client';

export const extractHtaResults = async (
  parsedDocument: ParsedDocument,
): Promise<HtaResultsRowOutput> => {
  const prompt = `
You are extracting HTA decision data from a document.

Return JSON only.

Fields:
- drugName
- indication
- country
- htaDecision (Recommended / Not Recommended / Deferred / Restricted)
- decisionDate
- restrictionDetails

Document:
${parsedDocument.rawText.slice(0, 15000)}
`;

  const response = await callOpenAI(prompt);
  const parsed = JSON.parse(response);

  return htaResultsRowSchema.parse(parsed);
};
