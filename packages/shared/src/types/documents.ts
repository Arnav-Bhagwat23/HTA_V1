import type { CanonicalGeography } from '../constants/countries';
import type { SourceType } from '../constants/source-types';
import type { ISODateString, UUID } from './common';

export interface SelectedDocument {
  documentId: UUID;
  title: string;
  sourceName: string;
  sourceType: SourceType;
  sourceCountry: CanonicalGeography | null;
  sourceUrl: string | null;
  publishedAt: ISODateString | null;
}

export interface ParsedDocument {
  documentId: UUID;
  sourceType: SourceType;
  title: string | null;
  publishedAt: ISODateString | null;
  rawText: string;
  metadata: Record<string, string | number | boolean | null>;
}
