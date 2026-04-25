import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const JAPAN_HTA_SOURCE_NAME = 'Japan HTA';
const DEFAULT_JAPAN_HTA_SEARCH_URL =
  'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html';

export const parseLatestJapanHtaSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_JAPAN_HTA_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: JAPAN_HTA_SOURCE_NAME,
    sourceCountry: 'JP',
    defaultTitle: 'Japan HTA Report',
    baseUrl,
  });
