import { describe, expect, it } from 'vitest';

import { AIFA_SEARCH_PAGE_FIXTURE } from './fixtures/aifa-search-page';
import { parseLatestAifaSelectedDocument } from './aifa.parser';

describe('parseLatestAifaSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestAifaSelectedDocument(
        AIFA_SEARCH_PAGE_FIXTURE,
        'https://www.aifa.gov.it/web/guest/ricerca',
      ),
    ).toEqual({
      documentId:
        'https://www.aifa.gov.it/documents/newest/aifa-determina-newest.pdf',
      title: 'AIFA Determina - Newest candidate',
      sourceName: 'AIFA',
      sourceType: 'pdf',
      sourceCountry: 'IT',
      sourceUrl:
        'https://www.aifa.gov.it/documents/newest/aifa-determina-newest.pdf',
      publishedAt: '2026-04-11T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestAifaSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestAifaSelectedDocument(
      AIFA_SEARCH_PAGE_FIXTURE,
      'https://www.aifa.gov.it/web/guest/ricerca',
    );

    expect(selected?.title).toBe('AIFA Determina - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.aifa.gov.it/documents/newest/aifa-determina-newest.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-04-11T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestAifaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/documents/mock/aifa-determina.pdf">AIFA Determina</a>
        </section>
      `,
      'https://www.aifa.gov.it/web/guest/ricerca',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.aifa.gov.it/documents/mock/aifa-determina.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestAifaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/documents/mock/aifa-determina.pdf">AIFA Determina</a>
          <a href="/documents/mock/aifa-determina.pdf">AIFA Determina</a>
        </section>
      `,
      'https://www.aifa.gov.it/web/guest/ricerca',
    );

    expect(selected?.documentId).toBe(
      'https://www.aifa.gov.it/documents/mock/aifa-determina.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestAifaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/documents/mock/aifa-determina.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.aifa.gov.it/web/guest/ricerca',
    );

    expect(selected?.title).toBe('AIFA Determina');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestAifaSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/documents/mock/aifa-determina.pdf">AIFA Determina</a>
        </section>
      `,
      'https://www.aifa.gov.it/web/guest/ricerca',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.aifa.gov.it/documents/mock/aifa-determina.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
