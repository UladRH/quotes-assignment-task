import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import {
  GetSimilarQuotesQueryDto,
  QuoteDto,
  QuoteIdPipe,
  QuoteLikeSummaryDto,
  QuotesApiService,
} from '../quotes-api';
import { QuRequireSession } from '../session';
import type { QuSession } from '../session';

@Controller('quotes')
export class QuotesRestApiController {
  constructor(private readonly quotesApiService: QuotesApiService) {}

  @Get('roll')
  @ZodResponse({ type: QuoteDto })
  getRolledQuote(@Session() session: QuSession): Promise<QuoteDto> {
    return this.quotesApiService.getRolledQuote({ session });
  }

  @Get(':quoteId')
  @ZodResponse({ type: QuoteDto })
  getQuoteById(
    @Param('quoteId', QuoteIdPipe) quoteId: string,
  ): Promise<QuoteDto> {
    return this.quotesApiService.getQuoteById({ quoteId });
  }

  @Get(':quoteId/similar')
  @ZodResponse({ type: [QuoteDto] })
  getSimilarQuotes(
    @Param('quoteId', QuoteIdPipe) quoteId: string,
    @Query() query: GetSimilarQuotesQueryDto,
  ): Promise<QuoteDto[]> {
    return this.quotesApiService.getSimilarQuotes({
      quoteId,
      limit: query.limit,
    });
  }

  @Post(':quoteId/likes')
  @QuRequireSession()
  @ZodResponse({ type: QuoteLikeSummaryDto })
  likeQuote(
    @Param('quoteId', QuoteIdPipe) quoteId: string,
    @Session() session: QuSession,
  ): Promise<QuoteLikeSummaryDto> {
    return this.quotesApiService.likeQuote({ quoteId, session });
  }

  @Delete(':quoteId/likes')
  @QuRequireSession()
  @ZodResponse({ type: QuoteLikeSummaryDto })
  unlikeQuote(
    @Param('quoteId', QuoteIdPipe) quoteId: string,
    @Session() session: QuSession,
  ): Promise<QuoteLikeSummaryDto> {
    return this.quotesApiService.unlikeQuote({ quoteId, session });
  }
}
