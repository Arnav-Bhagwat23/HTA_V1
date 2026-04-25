const DEFAULT_STUB_RESPONSE = JSON.stringify({
  drugName: null,
  indication: null,
  country: null,
  htaDecision: null,
  decisionDate: null,
  restrictionDetails: null,
});

const getLlmMode = (): string =>
  process.env.LLM_MODE?.trim() || 'stub';

export const callOpenAI = async (
  prompt: string,
): Promise<string> => {
  const mode = getLlmMode();

  if (mode === 'stub') {
    void prompt;
    return DEFAULT_STUB_RESPONSE;
  }

  if (mode === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_EXTRACTION_MODEL?.trim();

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when LLM_MODE=openai.');
    }

    if (!model) {
      throw new Error('OPENAI_EXTRACTION_MODEL is required when LLM_MODE=openai.');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI request failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = await response.json() as {
      output_text?: string;
    };

    if (typeof json.output_text !== 'string' || json.output_text.trim().length === 0) {
      throw new Error('OpenAI response did not contain output_text.');
    }

    return json.output_text;
  }

  throw new Error(`Unsupported LLM_MODE: ${mode}`);
};
