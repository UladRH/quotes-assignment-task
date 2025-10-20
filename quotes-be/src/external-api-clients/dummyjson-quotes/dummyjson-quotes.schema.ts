import { z } from 'zod';

export const DUMMY_JSON_MAX_QUOTE_LENGTH = 10000;
export const DUMMY_JSON_MAX_AUTHOR_LENGTH = 1000;

export const DummyJsonQuoteSchema = z.object({
  id: z.number().int().positive(),
  quote: z.string().trim().min(1).max(DUMMY_JSON_MAX_QUOTE_LENGTH),
  author: z.string().trim().min(1).max(DUMMY_JSON_MAX_AUTHOR_LENGTH),
});

export type DummyJsonQuote = z.infer<typeof DummyJsonQuoteSchema>;

export const DummyJsonQuotesListResponseSchema = z.object({
  quotes: z.array(DummyJsonQuoteSchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
});

export type DummyJsonQuotesListResponse = z.infer<
  typeof DummyJsonQuotesListResponseSchema
>;

export interface DummyJsonQuotesListParams {
  limit?: number;
  skip?: number;
}
