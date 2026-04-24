import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJson, fetchText } from './http-client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('http-client', () => {
  it('fetchText throws on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(fetchText('https://example.com/file.txt')).rejects.toThrow(
      'Failed to fetch text from https://example.com/file.txt: 500 Internal Server Error',
    );
  });

  it('fetchJson throws on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchJson('https://example.com/file.json')).rejects.toThrow(
      'Failed to fetch JSON from https://example.com/file.json: 404 Not Found',
    );
  });
});
