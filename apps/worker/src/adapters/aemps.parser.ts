import type { SelectedDocument } from '@hta/shared';

import { parseLatestPdfSelectedDocument } from './latest-pdf-discovery';

const AEMPS_SOURCE_NAME = 'AEMPS';
const DEFAULT_AEMPS_SEARCH_URL = 'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/';

export const parseLatestAempsSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_AEMPS_SEARCH_URL,
): SelectedDocument | null =>
  parseLatestPdfSelectedDocument(html, {
    sourceName: AEMPS_SOURCE_NAME,
    sourceCountry: 'ES',
    defaultTitle: 'AEMPS Resolution',
    baseUrl,
  });
