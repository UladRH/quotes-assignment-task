import { Injectable } from '@nestjs/common';

import { Quote, QuotesService } from '../quotes';
import { SessionService, QuSession } from '../session';
import { QuoteDto, QuoteLikeSummaryDto } from './dtos';

@Injectable()
export class QuotesApiService {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly sessionService: SessionService,
  ) {}

  async getRolledQuote({
    session,
  }: {
    session?: QuSession | null;
  } = {}): Promise<QuoteDto> {
    const excludeQuoteIds =
      this.sessionService.getRecentRolledQuoteIds(session);
    const userRolledRandomQuotesCount =
      this.sessionService.getRolledRandomQuotesCount(session);

    const quote = await this.quotesService.getRolledQuote({
      excludeQuoteIds,
      userRolledRandomQuotesCount,
    });

    this.sessionService.addRecentRolledQuoteId({
      session,
      quoteId: quote.quoteId,
    });

    return quote;
  }

  getQuoteById({ quoteId }: { quoteId: string }): Promise<QuoteDto> {
    return this.quotesService.getQuoteById({ quoteId });
  }

  getSimilarQuotes({
    quoteId,
    limit,
  }: {
    quoteId: string;
    limit: number;
  }): Promise<Quote[]> {
    return this.quotesService.getSimilarQuotes({ quoteId, limit });
  }

  async likeQuote({
    quoteId,
    session,
  }: {
    quoteId: string;
    session: QuSession;
  }): Promise<QuoteLikeSummaryDto> {
    const actorUserId = this.sessionService.getSessionUserId(session);

    const result = await this.quotesService.likeQuote({
      actorUserId,
      targetQuoteId: quoteId,
    });

    return result;
  }

  async unlikeQuote({
    quoteId,
    session,
  }: {
    quoteId: string;
    session: QuSession;
  }): Promise<QuoteLikeSummaryDto> {
    const actorUserId = this.sessionService.getSessionUserId(session);

    const result = await this.quotesService.unlikeQuote({
      actorUserId,
      targetQuoteId: quoteId,
    });

    return result;
  }
}
