import { describe, expect, it } from 'vitest';

import { JAPAN_HTA_SEARCH_PAGE_FIXTURE } from './fixtures/japan-search-page';
import { parseLatestJapanHtaSelectedDocument } from './japan.parser';

describe('parseLatestJapanHtaSelectedDocument', () => {
  it('extracts one PDF URL from fixture HTML and builds a SelectedDocument', () => {
    expect(
      parseLatestJapanHtaSelectedDocument(
        JAPAN_HTA_SEARCH_PAGE_FIXTURE,
        'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
      ),
    ).toEqual({
      documentId:
        'https://www.mhlw.go.jp/stf/newest/japan-hta-report-newest.pdf',
      title: 'Japan HTA Report - Newest candidate',
      sourceName: 'Japan HTA',
      sourceType: 'pdf',
      sourceCountry: 'JP',
      sourceUrl:
        'https://www.mhlw.go.jp/stf/newest/japan-hta-report-newest.pdf',
      publishedAt: '2026-04-18T00:00:00.000Z',
    });
  });

  it('returns null when no candidate exists', () => {
    expect(parseLatestJapanHtaSelectedDocument('<html><body>No PDFs here</body></html>')).toBeNull();
  });

  it('prefers the newest candidate when dates are present', () => {
    const selected = parseLatestJapanHtaSelectedDocument(
      JAPAN_HTA_SEARCH_PAGE_FIXTURE,
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );

    expect(selected?.title).toBe('Japan HTA Report - Newest candidate');
    expect(selected?.sourceUrl).toBe(
      'https://www.mhlw.go.jp/stf/newest/japan-hta-report-newest.pdf',
    );
    expect(selected?.publishedAt).toBe('2026-04-18T00:00:00.000Z');
  });

  it('resolves relative PDF URLs against the base URL', () => {
    const selected = parseLatestJapanHtaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/stf/mock/japan-hta-report.pdf">Japan HTA Report</a>
        </section>
      `,
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.mhlw.go.jp/stf/mock/japan-hta-report.pdf',
    );
  });

  it('deduplicates duplicate PDF links', () => {
    const selected = parseLatestJapanHtaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/stf/mock/japan-hta-report.pdf">Japan HTA Report</a>
          <a href="/stf/mock/japan-hta-report.pdf">Japan HTA Report</a>
        </section>
      `,
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );

    expect(selected?.documentId).toBe(
      'https://www.mhlw.go.jp/stf/mock/japan-hta-report.pdf',
    );
  });

  it('falls back to a default title when a PDF link has no title text', () => {
    const selected = parseLatestJapanHtaSelectedDocument(
      `
        <section>
          <p>2026-04-24</p>
          <a href="/stf/mock/japan-hta-report.pdf"><span>   </span></a>
        </section>
      `,
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );

    expect(selected?.title).toBe('Japan HTA Report');
  });

  it('tolerates malformed dates and still returns a candidate', () => {
    const selected = parseLatestJapanHtaSelectedDocument(
      `
        <section>
          <p>Published not-a-date</p>
          <a href="/stf/mock/japan-hta-report.pdf">Japan HTA Report</a>
        </section>
      `,
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );

    expect(selected?.sourceUrl).toBe(
      'https://www.mhlw.go.jp/stf/mock/japan-hta-report.pdf',
    );
    expect(selected?.publishedAt).toBeNull();
  });
});
