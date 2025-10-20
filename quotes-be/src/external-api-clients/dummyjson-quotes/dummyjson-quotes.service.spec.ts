import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import {
  DummyJsonQuote,
  DummyJsonQuotesListResponse,
} from './dummyjson-quotes.schema';
import { DummyJsonQuotesService } from './dummyjson-quotes.service';

const createAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {},
  } as never,
});

describe('DummyJsonQuotesService', () => {
  let service: DummyJsonQuotesService;
  let httpServiceMock: jest.Mocked<Pick<HttpService, 'get'>>;

  beforeEach(async () => {
    httpServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DummyJsonQuotesService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    service = module.get(DummyJsonQuotesService);
  });

  describe('getQuoteById', () => {
    it('returns the quote fetched by id', async () => {
      const quote: DummyJsonQuote = {
        id: 7,
        quote: 'Test quote',
        author: 'Tester',
      };

      httpServiceMock.get.mockReturnValueOnce(of(createAxiosResponse(quote)));

      const result = await service.getQuoteById(7);

      expect(httpServiceMock.get).toHaveBeenCalledWith('quotes/7');
      expect(result).toEqual(quote);
    });
  });

  describe('getQuotes', () => {
    it('requests quotes without query params when none provided', async () => {
      const response: DummyJsonQuotesListResponse = {
        limit: 0,
        skip: 0,
        total: 0,
        quotes: [],
      };

      httpServiceMock.get.mockReturnValueOnce(
        of(createAxiosResponse(response)),
      );

      const result = await service.getQuotes();

      expect(httpServiceMock.get).toHaveBeenCalledWith('quotes', {
        params: {},
      });
      expect(result).toEqual(response);
    });

    it('requests quotes with limit and skip when provided', async () => {
      const response: DummyJsonQuotesListResponse = {
        limit: 5,
        skip: 10,
        total: 50,
        quotes: [],
      };

      httpServiceMock.get.mockReturnValueOnce(
        of(createAxiosResponse(response)),
      );

      const result = await service.getQuotes({ limit: 5, skip: 10 });

      expect(httpServiceMock.get).toHaveBeenCalledWith('quotes', {
        params: { limit: 5, skip: 10 },
      });
      expect(result).toEqual(response);
    });
  });

  describe('getRandomQuote', () => {
    it('returns a random quote', async () => {
      const quote: DummyJsonQuote = {
        id: 3,
        quote: 'Random quote',
        author: 'Random Author',
      };

      httpServiceMock.get.mockReturnValueOnce(of(createAxiosResponse(quote)));

      const result = await service.getRandomQuote();

      expect(httpServiceMock.get).toHaveBeenCalledWith('quotes/random');
      expect(result).toEqual(quote);
    });
  });
});
