import { z } from 'zod';

export const normalizedQuerySchema = z.object({
  rawQuery: z.string(),
  canonicalDrug: z.string().nullable(),
  canonicalIndication: z.string().nullable(),
  canonicalGeography: z
    .enum(['AU', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'OTHER'])
    .nullable(),
  drugAliases: z.array(z.string()),
  indicationAliases: z.array(z.string()),
  geographyAliases: z.array(z.string()),
  confidence: z.object({
    drug: z.number(),
    indication: z.number(),
    geography: z.number(),
  }),
  requiresManualUpload: z.boolean(),
  warnings: z.array(z.string()),
});

export type NormalizedQueryInput = z.input<typeof normalizedQuerySchema>;
export type NormalizedQueryOutput = z.output<typeof normalizedQuerySchema>;

export const normalizedQueryJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    rawQuery: { type: 'string' },
    canonicalDrug: { type: ['string', 'null'] },
    canonicalIndication: { type: ['string', 'null'] },
    canonicalGeography: {
      type: ['string', 'null'],
      enum: ['AU', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'OTHER', null],
    },
    drugAliases: {
      type: 'array',
      items: { type: 'string' },
    },
    indicationAliases: {
      type: 'array',
      items: { type: 'string' },
    },
    geographyAliases: {
      type: 'array',
      items: { type: 'string' },
    },
    confidence: {
      type: 'object',
      additionalProperties: false,
      properties: {
        drug: { type: 'number' },
        indication: { type: 'number' },
        geography: { type: 'number' },
      },
      required: ['drug', 'indication', 'geography'],
    },
    requiresManualUpload: { type: 'boolean' },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'rawQuery',
    'canonicalDrug',
    'canonicalIndication',
    'canonicalGeography',
    'drugAliases',
    'indicationAliases',
    'geographyAliases',
    'confidence',
    'requiresManualUpload',
    'warnings',
  ],
} as const;
