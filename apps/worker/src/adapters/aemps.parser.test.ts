import { describe, expect, it } from 'vitest';

import { AEMPS_SEARCH_PAGE_FIXTURE } from './fixtures/aemps-search-page';
import { parseLatestAempsSelectedDocument } from './aemps.parser';

describe('parseLatestAempsSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestAempsSelectedDocument(
        AEMPS_SEARCH_PAGE_FIXTURE,
        'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
      ),
    ).toEqual({
      documentId:
        'https://www.aemps.gob.es/informes/newest/aemps-resolution-newest.pdf',
      title: 'AEMPS Resolution - Newest candidate',
      sourceName: 'AEMPS',
      sourceType: 'pdf',
      sourceCountry: 'ES',
      sourceUrl:
        'https://www.aemps.gob.es/informes/newest/aemps-resolution-newest.pdf',
      publishedAt: '2026-04-15T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestAempsSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestAempsSelectedDocument(
      AEMPS_SEARCH_PAGE_FIXTURE,
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );

    expect(selected?.title).toBe('AEMPS Resolution - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.aemps.gob.es/informes/newest/aemps-resolution-newest.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-04-15T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestAempsSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/informes/mock/aemps-resolution.pdf">AEMPS Resolution</a>
        </section>
      `,
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.aemps.gob.es/informes/mock/aemps-resolution.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestAempsSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/informes/mock/aemps-resolution.pdf">AEMPS Resolution</a>
          <a href="/informes/mock/aemps-resolution.pdf">AEMPS Resolution</a>
        </section>
      `,
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );

    expect(selected?.documentId).toBe(
      'https://www.aemps.gob.es/informes/mock/aemps-resolution.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestAempsSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/informes/mock/aemps-resolution.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );

    expect(selected?.title).toBe('AEMPS Resolution');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestAempsSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/informes/mock/aemps-resolution.pdf">AEMPS Resolution</a>
        </section>
      `,
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.aemps.gob.es/informes/mock/aemps-resolution.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
