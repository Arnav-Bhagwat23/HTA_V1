import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const NICE_SOURCE_NAME = 'NICE';
const DEFAULT_NICE_SEARCH_URL = 'https://www.nice.org.uk/guidance/published';

export const parseLatestNiceSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_NICE_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: NICE_SOURCE_NAME,
    sourceCountry: 'UK',
    defaultTitle: 'NICE Final Draft Guidance',
    baseUrl,
  });
