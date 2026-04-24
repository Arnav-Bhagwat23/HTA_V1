import { describe, expect, it } from 'vitest';

import { PBAC_SEARCH_PAGE_FIXTURE } from './fixtures/pbac-search-page';
import { parseLatestPbacSelectedDocument } from './pbac.parser';

describe('parseLatestPbacSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestPbacSelectedDocument(
        PBAC_SEARCH_PAGE_FIXTURE,
        'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
      ),
    ).toEqual({
      documentId:
        'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings/newest-document.pdf',
      title: 'PBAC Public Summary Document - Newest candidate',
      sourceName: 'PBAC',
      sourceType: 'pdf',
      sourceCountry: 'AU',
      sourceUrl:
        'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings/newest-document.pdf',
      publishedAt: '2026-03-05T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestPbacSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestPbacSelectedDocument(
      PBAC_SEARCH_PAGE_FIXTURE,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.title).toBe('PBAC Public Summary Document - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings/newest-document.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-03-05T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestPbacSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/info/mock-document.pdf">PBAC Public Summary Document</a>
        </section>
      `,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.sourceUrl).toBe('https://www.pbs.gov.au/info/mock-document.pdf');
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestPbacSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/info/mock-document.pdf">PBAC Public Summary Document</a>
          <a href="/info/mock-document.pdf">PBAC Public Summary Document</a>
        </section>
      `,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.documentId).toBe('https://www.pbs.gov.au/info/mock-document.pdf');
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestPbacSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/info/mock-document.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.title).toBe('PBAC Public Summary Document');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestPbacSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/info/mock-document.pdf">PBAC Public Summary Document</a>
        </section>
      `,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.sourceUrl).toBe('https://www.pbs.gov.au/info/mock-document.pdf');
    expect(selected?.publishedAt).toBeNull();
  });
});
