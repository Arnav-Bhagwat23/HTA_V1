import type { SelectedDocument } from '@hta/shared';

const PBAC_SOURCE_NAME = 'PBAC';
const DEFAULT_PBAC_SEARCH_URL =
  'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings';

interface PbacDocumentCandidate {
  title: string;
  url: string;
  publishedAt: string | null;
}

const toAbsoluteUrl = (url: string, baseUrl: string): string => {
  return new URL(url, baseUrl).toString();
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

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

  const parsedDate = new Date(
    longDateMatches[longDateMatches.length - 1][1],
  );
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const parseCandidates = (
  html: string,
  baseUrl: string,
): PbacDocumentCandidate[] => {
  const anchorPattern =
    /<a\b[^>]*href="([^"]+\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const candidates: PbacDocumentCandidate[] = [];

  for (const match of html.matchAll(anchorPattern)) {
    const rawUrl = match[1];
    const rawTitle = match[2];
    const htmlWindow = html.slice(
      Math.max(0, (match.index ?? 0) - 300),
      Math.min(html.length, (match.index ?? 0) + 300),
    );
    const title = normalizeWhitespace(rawTitle.replace(/<[^>]+>/g, ''));

    candidates.push({
      title: title.length > 0 ? title : 'PBAC Public Summary Document',
      url: toAbsoluteUrl(rawUrl, baseUrl),
      publishedAt: extractDate(htmlWindow),
    });
  }

  const uniqueCandidates = new Map<string, PbacDocumentCandidate>();

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
      existingCandidate.title === 'PBAC Public Summary Document' &&
      candidate.title !== 'PBAC Public Summary Document'
    ) {
      uniqueCandidates.set(candidate.url, candidate);
    }
  }

  return [...uniqueCandidates.values()];
};

const sortCandidates = (
  candidates: PbacDocumentCandidate[],
): PbacDocumentCandidate[] => {
  return [...candidates].sort((left, right) => {
    const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title);
  });
};

export const parseLatestPbacSelectedDocument = (
  html: string,
  baseUrl: string = DEFAULT_PBAC_SEARCH_URL,
): SelectedDocument | null => {
  const candidates = sortCandidates(parseCandidates(html, baseUrl));
  const selectedCandidate = candidates[0];

  if (!selectedCandidate) {
    return null;
  }

  return {
    documentId: selectedCandidate.url,
    title: selectedCandidate.title,
    sourceName: PBAC_SOURCE_NAME,
    sourceType: 'pdf',
    sourceCountry: 'AU',
    sourceUrl: selectedCandidate.url,
    publishedAt: selectedCandidate.publishedAt,
  };
};
