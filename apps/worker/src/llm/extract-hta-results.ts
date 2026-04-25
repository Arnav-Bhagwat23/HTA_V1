import type { ParsedDocument } from '@hta/shared';

import type { HtaResultsRow } from '../schema/hta-results.schema';
import { callOpenAI } from './openai-client';

export const extractHtaResults = async (
  parsedDocument: ParsedDocument,
): Promise<HtaResultsRow> => {
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

  return JSON.parse(response) as HtaResultsRow;
};
