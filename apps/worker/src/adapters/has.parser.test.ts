import { describe, expect, it } from 'vitest';

import { HAS_SEARCH_PAGE_FIXTURE } from './fixtures/has-search-page';
import { parseLatestHasSelectedDocument } from './has.parser';

describe('parseLatestHasSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestHasSelectedDocument(
        HAS_SEARCH_PAGE_FIXTURE,
        'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
      ),
    ).toEqual({
      documentId:
        'https://www.has-sante.fr/jcms/newest/decision-has-newest.pdf',
      title: 'HAS Decision - Newest candidate',
      sourceName: 'HAS',
      sourceType: 'pdf',
      sourceCountry: 'FR',
      sourceUrl:
        'https://www.has-sante.fr/jcms/newest/decision-has-newest.pdf',
      publishedAt: '2026-04-07T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestHasSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestHasSelectedDocument(
      HAS_SEARCH_PAGE_FIXTURE,
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );

    expect(selected?.title).toBe('HAS Decision - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.has-sante.fr/jcms/newest/decision-has-newest.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-04-07T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestHasSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/jcms/mock/decision-has.pdf">HAS Decision</a>
        </section>
      `,
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.has-sante.fr/jcms/mock/decision-has.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestHasSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/jcms/mock/decision-has.pdf">HAS Decision</a>
          <a href="/jcms/mock/decision-has.pdf">HAS Decision</a>
        </section>
      `,
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );

    expect(selected?.documentId).toBe(
      'https://www.has-sante.fr/jcms/mock/decision-has.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestHasSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/jcms/mock/decision-has.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );

    expect(selected?.title).toBe('HAS Decision');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestHasSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/jcms/mock/decision-has.pdf">HAS Decision</a>
        </section>
      `,
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.has-sante.fr/jcms/mock/decision-has.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
