import { describe, expect, it } from 'vitest';

import { GBA_SEARCH_PAGE_FIXTURE } from './fixtures/gba-search-page';
import { parseLatestGbaSelectedDocument } from './gba.parser';

describe('parseLatestGbaSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestGbaSelectedDocument(
        GBA_SEARCH_PAGE_FIXTURE,
        'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
      ),
    ).toEqual({
      documentId:
        'https://www.g-ba.de/downloads/39-261-newest/g-ba-beschluss-newest.pdf',
      title: 'G-BA Beschluss - Newest candidate',
      sourceName: 'G-BA',
      sourceType: 'pdf',
      sourceCountry: 'DE',
      sourceUrl:
        'https://www.g-ba.de/downloads/39-261-newest/g-ba-beschluss-newest.pdf',
      publishedAt: '2026-03-18T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestGbaSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestGbaSelectedDocument(
      GBA_SEARCH_PAGE_FIXTURE,
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );

    expect(selected?.title).toBe('G-BA Beschluss - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.g-ba.de/downloads/39-261-newest/g-ba-beschluss-newest.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-03-18T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestGbaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/downloads/39-261-mock/g-ba-beschluss.pdf">G-BA Beschluss</a>
        </section>
      `,
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.g-ba.de/downloads/39-261-mock/g-ba-beschluss.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestGbaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/downloads/39-261-mock/g-ba-beschluss.pdf">G-BA Beschluss</a>
          <a href="/downloads/39-261-mock/g-ba-beschluss.pdf">G-BA Beschluss</a>
        </section>
      `,
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );

    expect(selected?.documentId).toBe(
      'https://www.g-ba.de/downloads/39-261-mock/g-ba-beschluss.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestGbaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/downloads/39-261-mock/g-ba-beschluss.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );

    expect(selected?.title).toBe('G-BA Beschluss');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestGbaSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/downloads/39-261-mock/g-ba-beschluss.pdf">G-BA Beschluss</a>
        </section>
      `,
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.g-ba.de/downloads/39-261-mock/g-ba-beschluss.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
