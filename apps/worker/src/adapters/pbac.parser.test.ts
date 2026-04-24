import { describe, expect, it } from 'vitest';

import { parseLatestPbacSelectedDocument } from './pbac.parser';

describe('parseLatestPbacSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    const html = `
      <section>
        <span>2026-04-24</span>
        <a href="/info/mock-document.pdf">PBAC Public Summary Document</a>
      </section>
    `;

    expect(
      parseLatestPbacSelectedDocument(
        html,
        'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
      ),
    ).toEqual({
      documentId:
        'https://www.pbs.gov.au/info/mock-document.pdf',
      title: 'PBAC Public Summary Document',
      sourceName: 'PBAC',
      sourceType: 'pdf',
      sourceCountry: 'AU',
      sourceUrl: 'https://www.pbs.gov.au/info/mock-document.pdf',
      publishedAt: '2026-04-24T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestPbacSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const html = `
      <div>
        <p>2025-01-10</p>
        <a href="/info/older.pdf">Older PBAC Document</a>
      </div>
      <div>
        <p>2026-03-05</p>
        <a href="/info/newer.pdf">Newer PBAC Document</a>
      </div>
    `;

    const selected = parseLatestPbacSelectedDocument(
      html,
      'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings',
    );

    expect(selected?.title).toBe('Newer PBAC Document');
    expect(selected?.sourceUrl).toBe('https://www.pbs.gov.au/info/newer.pdf');
    expect(selected?.publishedAt).toBe('2026-03-05T00:00:00.000Z');
  });
});
