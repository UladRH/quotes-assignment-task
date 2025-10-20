import { UnauthorizedException } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ZodResponse } from 'nestjs-zod';

import type { MercuriusGraphqlContext } from '../graphql-context.util';
import { getSessionFromMercuriusContext } from '../graphql-context.util';
import {
  QuoteDto,
  QuoteIdPipe,
  QuoteLikeSummaryDto,
  QuotesApiService,
} from '../quotes-api';
import { QuRequireSession } from '../session';

@Resolver()
export class QuotesGraphqlApiResolver {
  constructor(private readonly quotesApiService: QuotesApiService) {}

  @Query('rolledQuote')
  @ZodResponse({ type: QuoteDto })
  getRolledQuote(
    @Context() context: MercuriusGraphqlContext,
  ): Promise<QuoteDto> {
    const session = getSessionFromMercuriusContext(context);

    return this.quotesApiService.getRolledQuote({ session });
  }

  @Query('quote')
  @ZodResponse({ type: QuoteDto })
  getQuoteById(
    @Args('quoteId', QuoteIdPipe) quoteId: string,
  ): Promise<QuoteDto> {
    return this.quotesApiService.getQuoteById({ quoteId });
  }

  @Mutation('likeQuote')
  @ZodResponse({ type: QuoteLikeSummaryDto })
  @QuRequireSession()
  likeQuote(
    @Args('quoteId', QuoteIdPipe) quoteId: string,
    @Context() context: MercuriusGraphqlContext,
  ): Promise<QuoteLikeSummaryDto> {
    const session = getSessionFromMercuriusContext(context);
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    return this.quotesApiService.likeQuote({ quoteId, session });
  }

  @Mutation('unlikeQuote')
  @ZodResponse({ type: QuoteLikeSummaryDto })
  @QuRequireSession()
  unlikeQuote(
    @Args('quoteId', QuoteIdPipe) quoteId: string,
    @Context() context: MercuriusGraphqlContext,
  ): Promise<QuoteLikeSummaryDto> {
    const session = getSessionFromMercuriusContext(context);
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    return this.quotesApiService.unlikeQuote({ quoteId, session });
  }
}
