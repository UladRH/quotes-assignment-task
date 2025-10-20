import { z } from 'zod';

import { APP_PARAMS } from '../../app-params';

export const STRING_MAX_LENGTH =
  APP_PARAMS.externalApi.dummyJsonQuotes.maxStringLength;

export const DummyJsonQuoteSchema = z.object({
  id: z.number().int().positive(),
  quote: z.string().trim().min(1).max(STRING_MAX_LENGTH),
  author: z.string().trim().min(1).max(STRING_MAX_LENGTH),
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
