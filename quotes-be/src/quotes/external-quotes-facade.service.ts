import { Injectable, NotFoundException } from '@nestjs/common';
import { isAxiosError } from 'axios';

import { Quote } from './quotes.types';
import { DummyJsonQuotesService } from '../external-api-clients/dummyjson-quotes';
import { DummyJsonQuote } from '../external-api-clients/dummyjson-quotes/dummyjson-quotes.schema';

@Injectable()
export class ExternalApiQuotesFacadeService {
  constructor(
    private readonly dummyJsonQuotesService: DummyJsonQuotesService,
  ) {}

  async getRandomQuote(): Promise<Quote> {
    const quote = await this.dummyJsonQuotesService.getRandomQuote();
    return this.mapQuote(quote);
  }

  async getQuoteById(id: string): Promise<Quote> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new Error(`Invalid quote ID: ${id}`);
    }

    try {
      const quote = await this.dummyJsonQuotesService.getQuoteById(numericId);
      return this.mapQuote(quote);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Quote with ID ${numericId} not found`);
      }

      throw error;
    }
  }

  private mapQuote(quote: DummyJsonQuote): Quote {
    return {
      quoteId: quote.id.toString(),
      quote: quote.quote,
      author: quote.author,
    };
  }

  private isNotFoundError(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === 404;
  }
}
