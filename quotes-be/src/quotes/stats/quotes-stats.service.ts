import { Injectable } from '@nestjs/common';

import { QuotesStatsRepo } from './quotes-stats.repository';

type LikeArgs = {
  actorUserId: string;
  targetQuoteId: string;
};

export type QuoteLikeSummary = {
  quoteId: string;
  likesCount: number;
  impressionsCount: number;
  isLiked: boolean;
  changed: boolean;
};

@Injectable()
export class QuotesStatsService {
  constructor(private readonly repository: QuotesStatsRepo) {}

  async likeQuote({
    actorUserId,
    targetQuoteId,
  }: LikeArgs): Promise<QuoteLikeSummary> {
    const result = await this.repository.likeQuote({
      actorUserId,
      targetQuoteId,
    });

    return {
      quoteId: targetQuoteId,
      likesCount: result.likesCount,
      impressionsCount: result.impressionsCount,
      isLiked: true,
      changed: result.changed,
    };
  }

  async unlikeQuote({
    actorUserId,
    targetQuoteId,
  }: LikeArgs): Promise<QuoteLikeSummary> {
    const result = await this.repository.unlikeQuote({
      actorUserId,
      targetQuoteId,
    });

    return {
      quoteId: targetQuoteId,
      likesCount: result.likesCount,
      impressionsCount: result.impressionsCount,
      isLiked: false,
      changed: result.changed,
    };
  }

  registerImpression({ quoteId }: { quoteId: string }): Promise<void> {
    return this.repository.incrementImpressionsCount(quoteId);
  }
}
