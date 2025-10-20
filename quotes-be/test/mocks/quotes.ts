import { NotFoundException } from '@nestjs/common';

import { Quote } from '../../src/quotes/quotes.types';

export function createExternalQuotesFacadeMock(
  fixtures: Record<string, Quote>,
) {
  const getQuoteById = jest.fn((quoteId: string) => {
    const quote = fixtures[quoteId];

    if (!quote) {
      throw new NotFoundException(`Unknown quote id ${quoteId}`);
    }

    return Promise.resolve(quote);
  });

  const getRandomQuote = jest.fn(() => Promise.resolve(fixtures['363']));

  return { getQuoteById, getRandomQuote };
}

export function createFindSimilarQuoteIdsMock(
  similarIds: Record<string, string[]>,
) {
  return jest.fn(({ quoteId, limit }: { quoteId: string; limit: number }) => {
    const available = similarIds[quoteId] ?? [];

    return Promise.resolve(available.slice(0, Math.max(0, limit)));
  });
}
