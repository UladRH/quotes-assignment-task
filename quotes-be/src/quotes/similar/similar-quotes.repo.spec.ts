import { Kysely } from 'kysely';

import { SimilarQuotesRepo } from './similar-quotes.repo';

type EmbeddingGemmaByQuoteIdTable = {
  quote_id: string;
  embedding: unknown;
};

type Database = {
  embeddinggemma_by_quote_id: EmbeddingGemmaByQuoteIdTable;
};

describe('SimilarQuotesRepo', () => {
  let dbMock: jest.Mocked<Kysely<Database>>;
  let repo: SimilarQuotesRepo;
  let selectBuilder: {
    innerJoin: jest.Mock;
    select: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    execute: jest.Mock;
  };
  let selectFromMock: jest.Mock;

  beforeEach(() => {
    selectBuilder = {
      innerJoin: jest.fn(),
      select: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      execute: jest.fn(),
    };

    selectBuilder.innerJoin.mockImplementation(
      (_table: string, callback: (join: { onRef: jest.Mock }) => void) => {
        callback({
          onRef: jest.fn(),
        });
        return selectBuilder;
      },
    );
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.where.mockReturnValue(selectBuilder);
    selectBuilder.orderBy.mockReturnValue(selectBuilder);
    selectBuilder.limit.mockReturnValue(selectBuilder);
    selectBuilder.execute.mockResolvedValue([
      { quote_id: 'a' },
      { quote_id: 'b' },
    ]);

    selectFromMock = jest.fn().mockReturnValue(selectBuilder);
    dbMock = {
      selectFrom: selectFromMock,
    } as unknown as jest.Mocked<Kysely<Database>>;

    repo = new SimilarQuotesRepo(dbMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list without hitting the database when limit is zero', async () => {
    await expect(
      repo.findSimilarQuoteIds({ quoteId: 'q1', limit: 0 }),
    ).resolves.toEqual([]);

    expect(selectFromMock).not.toHaveBeenCalled();
  });

  it('queries the database when limit is positive and coerces quote id to string', async () => {
    await expect(
      repo.findSimilarQuoteIds({ quoteId: 42 as unknown as string, limit: 2 }),
    ).resolves.toEqual(['a', 'b']);

    expect(selectFromMock).toHaveBeenCalledWith(
      'embeddinggemma_by_quote_id as target',
    );
    expect(selectBuilder.where).toHaveBeenCalledWith(
      'target.quote_id',
      '=',
      '42',
    );
    expect(selectBuilder.limit).toHaveBeenCalledWith(2);
    expect(selectBuilder.execute).toHaveBeenCalled();
  });
});
