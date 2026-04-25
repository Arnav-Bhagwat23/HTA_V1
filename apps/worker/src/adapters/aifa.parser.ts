import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const AIFA_SOURCE_NAME = 'AIFA';
const DEFAULT_AIFA_SEARCH_URL = 'https://www.aifa.gov.it/web/guest/ricerca';

export const parseLatestAifaSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_AIFA_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: AIFA_SOURCE_NAME,
    sourceCountry: 'IT',
    defaultTitle: 'AIFA Determina',
    baseUrl,
  });
