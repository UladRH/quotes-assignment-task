import { Injectable } from '@nestjs/common';

import { SimilarQuotesRepo } from './similar-quotes.repo';

@Injectable()
export class SimilarQuotesService {
  constructor(
    private readonly quotesRecommendationRepository: SimilarQuotesRepo,
  ) {}

  async getSimilarQuoteIds({
    quoteId,
    limit,
  }: {
    quoteId: string;
    limit: number;
  }): Promise<string[]> {
    if (limit <= 0) {
      return [];
    }

    return this.quotesRecommendationRepository.findSimilarQuoteIds({
      quoteId,
      limit,
    });
  }
}
