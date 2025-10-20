import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
  DummyJsonQuote,
  DummyJsonQuoteSchema,
  DummyJsonQuotesListParams,
  DummyJsonQuotesListResponse,
  DummyJsonQuotesListResponseSchema,
} from './dummyjson-quotes.schema';

@Injectable()
export class DummyJsonQuotesService {
  constructor(private readonly http: HttpService) {}

  async getQuoteById(id: number): Promise<DummyJsonQuote> {
    const response = await firstValueFrom(
      this.http.get<DummyJsonQuote>(`quotes/${encodeURIComponent(id)}`),
    );

    return this.parseQuote(response.data);
  }

  async getQuotes(
    params: DummyJsonQuotesListParams = {},
  ): Promise<DummyJsonQuotesListResponse> {
    const query: Record<string, number> = {};

    if (typeof params.limit === 'number') {
      query.limit = params.limit;
    }

    if (typeof params.skip === 'number') {
      query.skip = params.skip;
    }

    const response = await firstValueFrom(
      this.http.get<DummyJsonQuotesListResponse>('quotes', {
        params: query,
      }),
    );

    return this.parseQuoteList(response.data);
  }

  async getRandomQuote(): Promise<DummyJsonQuote> {
    const response = await firstValueFrom(
      this.http.get<DummyJsonQuote>('quotes/random'),
    );

    return this.parseQuote(response.data);
  }

  private parseQuote(payload: unknown): DummyJsonQuote {
    const result = DummyJsonQuoteSchema.safeParse(payload);

    if (!result.success) {
      throw new Error('Invalid quote payload received from DummyJSON');
    }

    return result.data;
  }

  private parseQuoteList(payload: unknown): DummyJsonQuotesListResponse {
    const result = DummyJsonQuotesListResponseSchema.safeParse(payload);

    if (!result.success) {
      throw new Error('Invalid quotes list payload received from DummyJSON');
    }

    return result.data;
  }
}
