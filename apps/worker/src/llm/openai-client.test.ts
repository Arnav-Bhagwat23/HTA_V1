import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  delete process.env.LLM_MODE;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_EXTRACTION_MODEL;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('callOpenAI', () => {
  it('stub mode returns deterministic test JSON', async () => {
    process.env.LLM_MODE = 'stub';
    const { callOpenAI } = await import('./openai-client');

    await expect(callOpenAI('test prompt')).resolves.toBe(
      JSON.stringify({
        drugName: null,
        indication: null,
        country: null,
        htaDecision: null,
        decisionDate: null,
        restrictionDetails: null,
      }),
    );
  });

  it('missing API key throws in openai mode', async () => {
    process.env.LLM_MODE = 'openai';
    process.env.OPENAI_EXTRACTION_MODEL = 'gpt-test';
    const { callOpenAI } = await import('./openai-client');

    await expect(callOpenAI('test prompt')).rejects.toThrow(
      'OPENAI_API_KEY is required when LLM_MODE=openai.',
    );
  });

  it('missing model throws in openai mode', async () => {
    process.env.LLM_MODE = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    const { callOpenAI } = await import('./openai-client');

    await expect(callOpenAI('test prompt')).rejects.toThrow(
      'OPENAI_EXTRACTION_MODEL is required when LLM_MODE=openai.',
    );
  });

  it('unsupported mode throws', async () => {
    process.env.LLM_MODE = 'unsupported';
    const { callOpenAI } = await import('./openai-client');

    await expect(callOpenAI('test prompt')).rejects.toThrow(
      'Unsupported LLM_MODE: unsupported',
    );
  });
});
