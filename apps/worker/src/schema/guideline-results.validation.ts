import { z } from 'zod';

export const guidelineResultsRowSchema = z.object({
  guidelineName: z.string().nullable(),
  issuingBody: z.string().nullable(),
  recommendation: z.string().nullable(),
  population: z.string().nullable(),
  lineOfTherapy: z.string().nullable(),
  notes: z.string().nullable(),
});

export type GuidelineResultsRowInput = z.input<typeof guidelineResultsRowSchema>;
export type GuidelineResultsRowOutput = z.output<
  typeof guidelineResultsRowSchema
>;

export const guidelineResultsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    guidelineName: {
      type: ['string', 'null'],
    },
    issuingBody: {
      type: ['string', 'null'],
    },
    recommendation: {
      type: ['string', 'null'],
    },
    population: {
      type: ['string', 'null'],
    },
    lineOfTherapy: {
      type: ['string', 'null'],
    },
    notes: {
      type: ['string', 'null'],
    },
  },
  required: [
    'guidelineName',
    'issuingBody',
    'recommendation',
    'population',
    'lineOfTherapy',
    'notes',
  ],
} as const;
