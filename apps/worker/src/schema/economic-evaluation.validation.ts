import { z } from 'zod';

export const economicEvaluationRowSchema = z.object({
  modelType: z.string().nullable(),
  perspective: z.string().nullable(),
  timeHorizon: z.string().nullable(),
  comparator: z.string().nullable(),
  icer: z.string().nullable(),
  costEffectivenessConclusion: z.string().nullable(),
});

export type EconomicEvaluationRowInput = z.input<
  typeof economicEvaluationRowSchema
>;
export type EconomicEvaluationRowOutput = z.output<
  typeof economicEvaluationRowSchema
>;

export const economicEvaluationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    modelType: {
      type: ['string', 'null'],
    },
    perspective: {
      type: ['string', 'null'],
    },
    timeHorizon: {
      type: ['string', 'null'],
    },
    comparator: {
      type: ['string', 'null'],
    },
    icer: {
      type: ['string', 'null'],
    },
    costEffectivenessConclusion: {
      type: ['string', 'null'],
    },
  },
  required: [
    'modelType',
    'perspective',
    'timeHorizon',
    'comparator',
    'icer',
    'costEffectivenessConclusion',
  ],
} as const;
