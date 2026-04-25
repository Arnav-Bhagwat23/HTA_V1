const DEFAULT_STUB_RESPONSE = JSON.stringify({
  drugName: null,
  indication: null,
  country: null,
  htaDecision: null,
  decisionDate: null,
  restrictionDetails: null,
});

const STRUCTURED_STUB_RESPONSES: Record<string, string> = {
  economic_evaluation: JSON.stringify({
    modelType: 'Partitioned survival model',
    perspective: 'Payer',
    timeHorizon: 'Lifetime',
    comparator: 'Standard of care',
    icer: '$45,000/QALY',
    costEffectivenessConclusion:
      'Considered cost-effective at current threshold.',
  }),
  guideline_results: JSON.stringify({
    guidelineName: 'Mock Oncology Guideline 2026',
    issuingBody: 'Mock Society',
    recommendation: 'Recommended in selected patients',
    population: 'Adults with mock condition',
    lineOfTherapy: 'Second line',
    notes: 'Use after progression on first-line therapy.',
  }),
  hta_results: DEFAULT_STUB_RESPONSE,
  trial_results: JSON.stringify({
    trialName: 'MOCK-301',
    phase: 'Phase 3',
    population: 'Adults with mock condition',
    comparator: 'Standard of care',
    primaryEndpoint: 'Progression-free survival',
    resultSummary: 'Mock trial showed benefit in the primary endpoint.',
  }),
  nma_results: JSON.stringify({
    comparison: 'Mock drug vs standard of care',
    outcome: 'Overall survival',
    effectMeasure: 'Hazard ratio',
    estimate: '0.78',
    credibleInterval: '0.65 to 0.94',
    conclusion: 'Mock drug favored in the NMA.',
  }),
};

const getLlmMode = (): string =>
  process.env.LLM_MODE?.trim() || 'stub';

const resolveOpenAIConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_EXTRACTION_MODEL?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when LLM_MODE=openai.');
  }

  if (!model) {
    throw new Error('OPENAI_EXTRACTION_MODEL is required when LLM_MODE=openai.');
  }

  return { apiKey, model };
};

const extractOutputText = (json: { output_text?: string }): string => {
  if (typeof json.output_text !== 'string' || json.output_text.trim().length === 0) {
    throw new Error('OpenAI response did not contain output_text.');
  }

  return json.output_text;
};

export const callOpenAI = async (
  prompt: string,
): Promise<string> => {
  const mode = getLlmMode();

  if (mode === 'stub') {
    void prompt;
    return DEFAULT_STUB_RESPONSE;
  }

  if (mode === 'openai') {
    const { apiKey, model } = resolveOpenAIConfig();
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

    return extractOutputText(await response.json() as {
      output_text?: string;
    });
  }

  throw new Error(`Unsupported LLM_MODE: ${mode}`);
};

export const callOpenAIStructured = async (
  prompt: string,
  schemaName: string,
  jsonSchema: Record<string, unknown>,
): Promise<string> => {
  const mode = getLlmMode();

  if (mode === 'stub') {
    void prompt;
    void jsonSchema;
    return STRUCTURED_STUB_RESPONSES[schemaName] ?? DEFAULT_STUB_RESPONSE;
  }

  if (mode === 'openai') {
    const { apiKey, model } = resolveOpenAIConfig();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: schemaName,
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI request failed: ${response.status} ${response.statusText}`,
      );
    }

    return extractOutputText(await response.json() as {
      output_text?: string;
    });
  }

  throw new Error(`Unsupported LLM_MODE: ${mode}`);
};
