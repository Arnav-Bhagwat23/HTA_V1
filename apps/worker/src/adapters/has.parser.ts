import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const HAS_SOURCE_NAME = 'HAS';
const DEFAULT_HAS_SEARCH_URL = 'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche';

export const parseLatestHasSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_HAS_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: HAS_SOURCE_NAME,
    sourceCountry: 'FR',
    defaultTitle: 'HAS Decision',
    baseUrl,
  });
