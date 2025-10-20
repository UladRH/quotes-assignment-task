import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

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

interface QuoteWithSimilar extends Quote {
  similarQuotes: Quote[];
}

describe('Quotes GraphQL API (e2e)', () => {
  let app: NestFastifyApplication;

  const externalQuotesFacadeMock =
    createExternalQuotesFacadeMock(QUOTE_FIXTURES);

  const findSimilarQuoteIds =
    createFindSimilarQuoteIdsMock(SIMILAR_IDS_FIXTURE);

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

  const executeQuery = (payload: {
    query: string;
    variables?: Record<string, unknown>;
  }) => request(app.getHttpServer()).post('/graphql').send(payload).expect(200);

  describe('query.quote', () => {
    it('returns the quote details for a valid id', async () => {
      const response = await executeQuery({
        query: `
          query Quote($id: ID!) {
            quote(quoteId: $id) {
              quoteId
              quote
              author
            }
          }
        `,
        variables: { id: '363' },
      });

      const body = response.body as { data?: { quote?: Quote } };

      expect(body.data?.quote).toEqual(QUOTE_FIXTURES['363']);
      expect(externalQuotesFacadeMock.getQuoteById).toHaveBeenCalledWith('363');
    });

    it('returns similar quotes when limit is provided', async () => {
      const response = await executeQuery({
        query: `
          query QuoteWithSimilar($id: ID!, $limit: Int) {
            quote(quoteId: $id) {
              quoteId
              quote
              author
              similarQuotes(limit: $limit) {
                quoteId
                quote
                author
              }
            }
          }
        `,
        variables: { id: '363', limit: 3 },
      });

      const body = response.body as {
        data?: { quote?: QuoteWithSimilar };
      };

      const expectedSimilar = SIMILAR_IDS_FIXTURE['363']
        .slice(0, 3)
        .map((id) => QUOTE_FIXTURES[id]);

      expect(body.data?.quote?.similarQuotes).toEqual(expectedSimilar);
      expect(findSimilarQuoteIds).toHaveBeenCalledWith({
        quoteId: '363',
        limit: 3,
      });
    });

    it('falls back to default limit when similarQuotes limit is omitted', async () => {
      const response = await executeQuery({
        query: `
          query QuoteWithSimilar($id: ID!) {
            quote(quoteId: $id) {
              quoteId
              similarQuotes {
                quoteId
              }
            }
          }
        `,
        variables: { id: '363' },
      });

      const body = response.body as {
        data?: {
          quote?: {
            similarQuotes: Array<Pick<Quote, 'quoteId'>>;
          };
        };
      };

      expect(body.data?.quote?.similarQuotes).toEqual(
        SIMILAR_IDS_FIXTURE['363'].map((id) => ({ quoteId: id })),
      );
      expect(findSimilarQuoteIds).toHaveBeenCalledWith({
        quoteId: '363',
        limit: 5,
      });
    });

    it('rejects non-numeric quote ids', async () => {
      const response = await executeQuery({
        query: `
          query Quote($id: ID!) {
            quote(quoteId: $id) {
              quoteId
            }
          }
        `,
        variables: { id: 'not-a-number' },
      });

      const body = response.body as {
        errors?: Array<{ message?: string }>;
        data?: { quote?: Quote };
      };

      expect(body.data?.quote).toBeUndefined();
      expect(body.errors?.[0]?.message).toContain(
        'quoteId must be a positive integer string',
      );
      expect(externalQuotesFacadeMock.getQuoteById).not.toHaveBeenCalled();
    });
  });
});
