import { z } from 'zod';

export const trialResultsRowSchema = z.object({
  trialName: z.string().nullable(),
  phase: z.string().nullable(),
  population: z.string().nullable(),
  comparator: z.string().nullable(),
  primaryEndpoint: z.string().nullable(),
  resultSummary: z.string().nullable(),
});

export type TrialResultsRowInput = z.input<typeof trialResultsRowSchema>;
export type TrialResultsRowOutput = z.output<typeof trialResultsRowSchema>;

export const trialResultsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    trialName: {
      type: ['string', 'null'],
    },
    phase: {
      type: ['string', 'null'],
    },
    population: {
      type: ['string', 'null'],
    },
    comparator: {
      type: ['string', 'null'],
    },
    primaryEndpoint: {
      type: ['string', 'null'],
    },
    resultSummary: {
      type: ['string', 'null'],
    },
  },
  required: [
    'trialName',
    'phase',
    'population',
    'comparator',
    'primaryEndpoint',
    'resultSummary',
  ],
} as const;
