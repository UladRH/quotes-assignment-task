import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import {
  ExternalApiQuotesFacadeService,
  Quote,
  SimilarQuotesRepo,
} from '../src/quotes';
import { QUOTE_FIXTURES, SIMILAR_IDS_FIXTURE } from './fixtures/quotes';
import {
  createExternalQuotesFacadeMock,
  createFindSimilarQuoteIdsMock,
} from './mocks/quotes';

describe('Quotes REST API (e2e)', () => {
  let app: NestFastifyApplication;

  const externalQuotesFacadeMock =
    createExternalQuotesFacadeMock(QUOTE_FIXTURES);

  const findSimilarQuoteIds =
    createFindSimilarQuoteIdsMock(SIMILAR_IDS_FIXTURE);

  const getServer = () => app.getHttpServer() as unknown as App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ExternalApiQuotesFacadeService)
      .useValue(externalQuotesFacadeMock)
      .overrideProvider(SimilarQuotesRepo)
      .useValue({ findSimilarQuoteIds })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /quotes/:quoteId', () => {
    it('returns the quote details for a valid id', async () => {
      const response = await request(getServer())
        .get('/quotes/363')
        .expect(200);

      const body = response.body as Quote;

      expect(body).toEqual(QUOTE_FIXTURES['363']);
      expect(externalQuotesFacadeMock.getQuoteById).toHaveBeenCalledTimes(1);
      expect(externalQuotesFacadeMock.getQuoteById).toHaveBeenCalledWith('363');
    });

    it('rejects non-numeric quote ids', async () => {
      const response = await request(getServer())
        .get('/quotes/not-a-number')
        .expect(400);

      const body = response.body as { message: string[] };

      expect(body.message).toContain(
        'quoteId must be a positive integer string',
      );
      expect(externalQuotesFacadeMock.getQuoteById).not.toHaveBeenCalled();
    });
  });

  describe('GET /quotes/:quoteId/similar', () => {
    it('returns similar quotes respecting the provided limit', async () => {
      const response = await request(getServer())
        .get('/quotes/363/similar?limit=3')
        .expect(200);

      const body = response.body as Quote[];

      expect(body).toEqual(
        SIMILAR_IDS_FIXTURE['363'].slice(0, 3).map((id) => QUOTE_FIXTURES[id]),
      );
      expect(findSimilarQuoteIds).toHaveBeenCalledWith({
        quoteId: '363',
        limit: 3,
      });
    });

    it('falls back to the default limit when none is provided', async () => {
      const response = await request(getServer())
        .get('/quotes/363/similar')
        .expect(200);

      const body = response.body as Quote[];

      expect(body).toEqual(
        SIMILAR_IDS_FIXTURE['363'].map((id) => QUOTE_FIXTURES[id]),
      );
      expect(findSimilarQuoteIds).toHaveBeenCalledWith({
        quoteId: '363',
        limit: 5,
      });
    });

    it('rejects requests that exceed the maximum limit', async () => {
      const response = await request(getServer())
        .get('/quotes/363/similar?limit=10')
        .expect(400);

      const body = response.body as { statusCode: number };

      expect(body.statusCode).toBe(400);
      expect(findSimilarQuoteIds).not.toHaveBeenCalled();
    });
  });
});
