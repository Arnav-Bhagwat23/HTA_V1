import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const PBAC_SOURCE_NAME = 'PBAC';
const DEFAULT_PBAC_SEARCH_URL =
  'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings';

export const parseLatestPbacSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_PBAC_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: PBAC_SOURCE_NAME,
    sourceCountry: 'AU',
    defaultTitle: 'PBAC Public Summary Document',
    baseUrl,
  });
