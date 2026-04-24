import { describe, expect, it } from 'vitest';

import { NICE_SEARCH_PAGE_FIXTURE } from './fixtures/nice-search-page';
import { parseLatestNiceSelectedDocument } from './nice.parser';

describe('parseLatestNiceSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestNiceSelectedDocument(
        NICE_SEARCH_PAGE_FIXTURE,
        'https://www.nice.org.uk/guidance/published',
      ),
    ).toEqual({
      documentId:
        'https://www.nice.org.uk/guidance/mock-drug/documents/newest-guidance.pdf',
      title: 'NICE Final Draft Guidance - Newest candidate',
      sourceName: 'NICE',
      sourceType: 'pdf',
      sourceCountry: 'UK',
      sourceUrl:
        'https://www.nice.org.uk/guidance/mock-drug/documents/newest-guidance.pdf',
      publishedAt: '2026-02-12T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestNiceSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestNiceSelectedDocument(
      NICE_SEARCH_PAGE_FIXTURE,
      'https://www.nice.org.uk/guidance/published',
    );

    expect(selected?.title).toBe('NICE Final Draft Guidance - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.nice.org.uk/guidance/mock-drug/documents/newest-guidance.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-02-12T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestNiceSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/guidance/mock-drug/documents/mock-guidance.pdf">NICE Final Draft Guidance</a>
        </section>
      `,
      'https://www.nice.org.uk/guidance/published',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.nice.org.uk/guidance/mock-drug/documents/mock-guidance.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestNiceSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/guidance/mock-drug/documents/mock-guidance.pdf">NICE Final Draft Guidance</a>
          <a href="/guidance/mock-drug/documents/mock-guidance.pdf">NICE Final Draft Guidance</a>
        </section>
      `,
      'https://www.nice.org.uk/guidance/published',
    );

    expect(selected?.documentId).toBe(
      'https://www.nice.org.uk/guidance/mock-drug/documents/mock-guidance.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestNiceSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/guidance/mock-drug/documents/mock-guidance.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.nice.org.uk/guidance/published',
    );

    expect(selected?.title).toBe('NICE Final Draft Guidance');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestNiceSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/guidance/mock-drug/documents/mock-guidance.pdf">NICE Final Draft Guidance</a>
        </section>
      `,
      'https://www.nice.org.uk/guidance/published',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.nice.org.uk/guidance/mock-drug/documents/mock-guidance.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
