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
