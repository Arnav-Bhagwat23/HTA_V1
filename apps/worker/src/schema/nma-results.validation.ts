import { z } from 'zod';

export const nmaResultsRowSchema = z.object({
  comparison: z.string().nullable(),
  outcome: z.string().nullable(),
  effectMeasure: z.string().nullable(),
  estimate: z.string().nullable(),
  credibleInterval: z.string().nullable(),
  conclusion: z.string().nullable(),
});

export type NmaResultsRowInput = z.input<typeof nmaResultsRowSchema>;
export type NmaResultsRowOutput = z.output<typeof nmaResultsRowSchema>;

export const nmaResultsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    comparison: {
      type: ['string', 'null'],
    },
    outcome: {
      type: ['string', 'null'],
    },
    effectMeasure: {
      type: ['string', 'null'],
    },
    estimate: {
      type: ['string', 'null'],
    },
    credibleInterval: {
      type: ['string', 'null'],
    },
    conclusion: {
      type: ['string', 'null'],
    },
  },
  required: [
    'comparison',
    'outcome',
    'effectMeasure',
    'estimate',
    'credibleInterval',
    'conclusion',
  ],
} as const;
