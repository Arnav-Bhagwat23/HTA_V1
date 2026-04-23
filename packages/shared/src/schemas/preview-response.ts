import { z } from 'zod';

import { JOB_MODES } from '../constants/job-modes';
import { JOB_STATUSES } from '../constants/job-statuses';
import { WARNING_CODES } from '../constants/warning-codes';

const warningCodeSchema = z.enum(WARNING_CODES);
const jobStatusSchema = z.enum(JOB_STATUSES);
const jobModeSchema = z.enum(JOB_MODES);

export const evidenceReferenceSchema = z.object({
  documentId: z.string().uuid(),
  documentTitle: z.string().nullable(),
  documentUrl: z.string().url().nullable(),
  sourcePage: z.string().nullable(),
  snippet: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export const extractedFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldLabel: z.string().min(1),
  value: z.string().nullable(),
  confidence: z.number().nullable(),
  warningCodes: z.array(warningCodeSchema),
  evidence: z.array(evidenceReferenceSchema),
});

export const previewResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: jobStatusSchema,
  mode: jobModeSchema,
  fields: z.array(extractedFieldSchema),
  warnings: z.array(warningCodeSchema),
  downloadable: z.boolean(),
});

export type PreviewResponseSchemaInput = z.input<typeof previewResponseSchema>;
export type PreviewResponseSchemaOutput = z.output<typeof previewResponseSchema>;
