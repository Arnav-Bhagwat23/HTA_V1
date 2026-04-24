import type { SelectedDocument } from '@hta/shared';

interface PdfDocumentCandidate {
  title: string;
  url: string;
  publishedAt: string | null;
}

interface LatestPdfDiscoveryOptions {
  sourceName: string;
  sourceCountry: SelectedDocument['sourceCountry'];
  defaultTitle: string;
  baseUrl: string;
}

const toAbsoluteUrl = (url: string, baseUrl: string): string =>
  new URL(url, baseUrl).toString();

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const extractDate = (htmlFragment: string): string | null => {
  const isoMatches = [...htmlFragment.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)];

  if (isoMatches.length > 0) {
    return `${isoMatches[isoMatches.length - 1][1]}T00:00:00.000Z`;
  }

  const longDateMatches = [
    ...htmlFragment.matchAll(/\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/g),
  ];

  if (longDateMatches.length === 0) {
    return null;
  }

  const parsedDate = new Date(longDateMatches[longDateMatches.length - 1][1]);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const parseCandidates = (
  html: string,
  options: LatestPdfDiscoveryOptions,
): PdfDocumentCandidate[] => {
  const anchorPattern =
    /<a\b[^>]*href="([^"]+\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const candidates: PdfDocumentCandidate[] = [];

  for (const match of html.matchAll(anchorPattern)) {
    const rawUrl = match[1];
    const rawTitle = match[2];
    const htmlWindow = html.slice(
      Math.max(0, (match.index ?? 0) - 300),
      Math.min(html.length, (match.index ?? 0) + 300),
    );
    const title = normalizeWhitespace(rawTitle.replace(/<[^>]+>/g, ''));

    candidates.push({
      title: title.length > 0 ? title : options.defaultTitle,
      url: toAbsoluteUrl(rawUrl, options.baseUrl),
      publishedAt: extractDate(htmlWindow),
    });
  }

  const uniqueCandidates = new Map<string, PdfDocumentCandidate>();

  for (const candidate of candidates) {
    const existingCandidate = uniqueCandidates.get(candidate.url);

    if (!existingCandidate) {
      uniqueCandidates.set(candidate.url, candidate);
      continue;
    }

    const existingTime = existingCandidate.publishedAt
      ? Date.parse(existingCandidate.publishedAt)
      : 0;
    const nextTime = candidate.publishedAt
      ? Date.parse(candidate.publishedAt)
      : 0;

    if (nextTime > existingTime) {
      uniqueCandidates.set(candidate.url, candidate);
      continue;
    }

    if (
      existingCandidate.title === options.defaultTitle &&
      candidate.title !== options.defaultTitle
    ) {
      uniqueCandidates.set(candidate.url, candidate);
    }
  }

  return [...uniqueCandidates.values()];
};

const sortCandidates = (
  candidates: PdfDocumentCandidate[],
): PdfDocumentCandidate[] =>
  [...candidates].sort((left, right) => {
    const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title);
  });

export const parseLatestPdfSelectedDocument = (
  html: string,
  options: LatestPdfDiscoveryOptions,
): SelectedDocument | null => {
  const candidates = sortCandidates(parseCandidates(html, options));
  const selectedCandidate = candidates[0];

  if (!selectedCandidate) {
    return null;
  }

  return {
    documentId: selectedCandidate.url,
    title: selectedCandidate.title,
    sourceName: options.sourceName,
    sourceType: 'pdf',
    sourceCountry: options.sourceCountry,
    sourceUrl: selectedCandidate.url,
    publishedAt: selectedCandidate.publishedAt,
  };
};
