export const SOURCE_TYPES = ['pdf', 'html', 'upload'] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

const SOURCE_TYPE_SET: ReadonlySet<string> = new Set(SOURCE_TYPES);

export const isSourceType = (value: string): value is SourceType =>
  SOURCE_TYPE_SET.has(value);
