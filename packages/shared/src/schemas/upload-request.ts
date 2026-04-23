import { z } from 'zod';

export const uploadFileSchema = z.object({
  originalFilename: z.string().trim().min(1).max(512),
  mimeType: z.string().trim().min(1).max(128),
  sizeBytes: z.number().int().positive(),
});

export const uploadRequestSchema = z.object({
  jobId: z.string().uuid(),
  files: z.array(uploadFileSchema).min(1).max(10),
});

export type UploadRequestSchemaInput = z.input<typeof uploadRequestSchema>;
export type UploadRequestSchemaOutput = z.output<typeof uploadRequestSchema>;
