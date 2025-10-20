import { Injectable } from '@nestjs/common';

import { APP_PARAMS } from '../app-params';
import { ExternalApiQuotesFacadeService } from './external-quotes-facade.service';
import { HighRatedQuotesService } from './high-rated';
import { Quote } from './quotes.types';
import { SimilarQuotesService } from './similar';
import { QuotesStatsService, QuoteLikeSummary } from './stats';

const RANDOM_ROLL_PARAMS = APP_PARAMS.quotes.randomRoll;

@Injectable()
export class QuotesService {
  constructor(
    private readonly externalApiService: ExternalApiQuotesFacadeService,
    private readonly similarQuotesService: SimilarQuotesService,
    private readonly highRatedQuotesService: HighRatedQuotesService,
    private readonly quotesStatsService: QuotesStatsService,
  ) {}

  async getRolledQuote({
    excludeQuoteIds = [],
    userRolledRandomQuotesCount = null,
  }: {
    excludeQuoteIds?: string[];
    userRolledRandomQuotesCount?: number | null;
  } = {}): Promise<Quote> {
    const isNewUser =
      userRolledRandomQuotesCount === null ||
      userRolledRandomQuotesCount <=
        RANDOM_ROLL_PARAMS.newUser.ratedQuoteThreshold;

    const highRatedQuoteChance = isNewUser
      ? RANDOM_ROLL_PARAMS.newUser.highRatedChance
      : RANDOM_ROLL_PARAMS.highRatedChance;

    const quote =
      Math.random() < highRatedQuoteChance
        ? await this.getRandomHighRatedQuote({ excludeQuoteIds })
        : await this.getTrulyRandomQuote({ excludeQuoteIds });

    await this.quotesStatsService.registerImpression(quote);

    return quote;
  }

  private async getRandomHighRatedQuote({
    excludeQuoteIds = [],
  }: {
    excludeQuoteIds?: string[];
  } = {}): Promise<Quote> {
    const quoteId = await this.highRatedQuotesService
      .getRandomQuoteId({ excludeQuoteIds })
      .catch(() => null);

    if (quoteId) {
      const quote = await this.externalApiService
        .getQuoteById(quoteId)
        .catch(() => null);

      if (quote) {
        return quote;
      }
    }

    return this.getTrulyRandomQuote({ excludeQuoteIds });
  }

  private async getTrulyRandomQuote({
    excludeQuoteIds = [],
  }: {
    excludeQuoteIds?: string[];
  } = {}): Promise<Quote> {
    const exclusions = new Set(excludeQuoteIds);

    let last: Quote | null = null;

    for (
      let attempt = 0;
      attempt < RANDOM_ROLL_PARAMS.maxRerollAttempts;
      attempt += 1
    ) {
      const quote = await this.externalApiService.getRandomQuote();

      last = quote;

      if (!exclusions.has(quote.quoteId)) {
        return quote;
      }
    }

    return last ?? (await this.externalApiService.getRandomQuote());
  }

  async getQuoteById({ quoteId }: { quoteId: string }): Promise<Quote> {
    const quote = await this.externalApiService.getQuoteById(quoteId);

    await this.quotesStatsService.registerImpression(quote);

    return quote;
  }

  async getSimilarQuotes({
    quoteId,
    limit,
  }: {
    quoteId: string;
    limit: number;
  }): Promise<Quote[]> {
    const similarIds = await this.similarQuotesService.getSimilarQuoteIds({
      quoteId,
      limit,
    });
    if (!similarIds.length) {
      return [];
    }

    const batchResults = await Promise.allSettled(
      similarIds.map((id) => this.externalApiService.getQuoteById(id)),
    );

    const fulfilledQuotes = batchResults
      .filter(
        (r): r is PromiseFulfilledResult<Quote> => r.status === 'fulfilled',
      )
      .map((r) => r.value);

    await Promise.all(
      fulfilledQuotes.map((quote) =>
        this.quotesStatsService.registerImpression(quote),
      ),
    );

    return fulfilledQuotes;
  }

  likeQuote({
    actorUserId,
    targetQuoteId,
  }: {
    actorUserId: string;
    targetQuoteId: string;
  }): Promise<QuoteLikeSummary> {
    return this.quotesStatsService.likeQuote({ actorUserId, targetQuoteId });
  }

  unlikeQuote({
    actorUserId,
    targetQuoteId,
  }: {
    actorUserId: string;
    targetQuoteId: string;
  }): Promise<QuoteLikeSummary> {
    return this.quotesStatsService.unlikeQuote({ actorUserId, targetQuoteId });
  }
}
