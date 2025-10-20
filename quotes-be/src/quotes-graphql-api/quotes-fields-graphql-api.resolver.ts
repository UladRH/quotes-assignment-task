import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ZodResponse } from 'nestjs-zod';

import {
  GetSimilarQuotesQueryDto,
  QuoteDto,
  QuotesApiService,
} from '../quotes-api';

@Resolver('Quote')
export class QuotesFieldsGraphqlApiResolver {
  constructor(private readonly quotesApiService: QuotesApiService) {}

  @ResolveField('similarQuotes')
  @ZodResponse({ type: [QuoteDto] })
  getSimilarQuotes(
    @Parent() quote: QuoteDto,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<QuoteDto[]> {
    const { limit: resolvedLimit } = GetSimilarQuotesQueryDto.parse({ limit });

    return this.quotesApiService.getSimilarQuotes({
      quoteId: quote.quoteId,
      limit: resolvedLimit,
    });
  }
}
