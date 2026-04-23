import { z } from 'zod';

export const searchRequestSchema = z.object({
  query: z.string().trim().min(1).max(2000),
});

export type SearchRequestSchemaInput = z.input<typeof searchRequestSchema>;
export type SearchRequestSchemaOutput = z.output<typeof searchRequestSchema>;
