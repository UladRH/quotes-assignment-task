import { Injectable } from '@nestjs/common';

import { HighRatedQuotesRepo } from './high-rated-quotes.repo';

type PickArgs = {
  excludeQuoteIds?: string[];
  explore?: boolean;
};

@Injectable()
export class HighRatedQuotesService {
  constructor(private readonly repo: HighRatedQuotesRepo) {}

  async getRandomQuoteId({ excludeQuoteIds = [] }: PickArgs = {}): Promise<
    string | null
  > {
    return this.repo.pickRandomQuoteId({ excludeQuoteIds });
  }
}
