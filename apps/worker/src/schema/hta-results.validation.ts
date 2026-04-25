import { z } from 'zod';

export const htaResultsRowSchema = z.object({
  drugName: z.string().nullable(),
  indication: z.string().nullable(),
  country: z.string().nullable(),
  htaDecision: z
    .enum(['Recommended', 'Not Recommended', 'Deferred', 'Restricted'])
    .nullable(),
  decisionDate: z.string().nullable(),
  restrictionDetails: z.string().nullable(),
});

export type HtaResultsRowInput = z.input<typeof htaResultsRowSchema>;
export type HtaResultsRowOutput = z.output<typeof htaResultsRowSchema>;

export const htaResultsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    drugName: {
      type: ['string', 'null'],
    },
    indication: {
      type: ['string', 'null'],
    },
    country: {
      type: ['string', 'null'],
    },
    htaDecision: {
      type: ['string', 'null'],
      enum: ['Recommended', 'Not Recommended', 'Deferred', 'Restricted', null],
    },
    decisionDate: {
      type: ['string', 'null'],
    },
    restrictionDetails: {
      type: ['string', 'null'],
    },
  },
  required: [
    'drugName',
    'indication',
    'country',
    'htaDecision',
    'decisionDate',
    'restrictionDetails',
  ],
} as const;
