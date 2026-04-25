import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const GBA_SOURCE_NAME = 'G-BA';
const DEFAULT_GBA_SEARCH_URL = 'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/';

export const parseLatestGbaSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_GBA_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: GBA_SOURCE_NAME,
    sourceCountry: 'DE',
    defaultTitle: 'G-BA Beschluss',
    baseUrl,
  });
