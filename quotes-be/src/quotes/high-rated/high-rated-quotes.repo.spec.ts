import { sql } from 'kysely';

import { HighRatedQuotesRepo } from './high-rated-quotes.repo';

const createCandidateBuilder = () => {
  const builder = {
    select: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  };

  type SelectionCallback = (expression: {
    ref: (value: string) => string;
  }) => unknown;
  const isSelectionCallback = (
    arg: SelectionCallback | unknown[],
  ): arg is SelectionCallback => typeof arg === 'function';

  builder.select.mockImplementation((arg: SelectionCallback | unknown[]) => {
    if (isSelectionCallback(arg)) {
      const ref = jest.fn().mockImplementation(() => ({
        as: jest.fn().mockReturnValue(undefined),
      }));
      arg({ ref });
    }
    return builder;
  });
  builder.where.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);

  return builder;
};

describe('HighRatedQuotesRepo', () => {
  let repo: HighRatedQuotesRepo;
  let candidateBuilder: ReturnType<typeof createCandidateBuilder>;
  let cteQueryBuilder: {
    selectAll: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    executeTakeFirst: jest.Mock;
  };

  beforeEach(() => {
    candidateBuilder = createCandidateBuilder();

    cteQueryBuilder = {
      selectAll: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      executeTakeFirst: jest.fn(),
    };
    cteQueryBuilder.selectAll.mockReturnValue(cteQueryBuilder);
    cteQueryBuilder.orderBy.mockReturnValue(cteQueryBuilder);
    cteQueryBuilder.limit.mockReturnValue(cteQueryBuilder);

    const cteBuilder = {
      selectFrom: jest.fn().mockReturnValue(cteQueryBuilder),
    };

    const withMock = jest.fn(
      (name: string, callback: (qb: { selectFrom: jest.Mock }) => unknown) => {
        expect(name).toBe('top_candidates');
        const qb = {
          selectFrom: jest.fn().mockReturnValue(candidateBuilder),
        };
        callback(qb);
        return cteBuilder;
      },
    );

    const dbStub = {
      with: withMock,
    };

    repo = Object.create(HighRatedQuotesRepo.prototype) as HighRatedQuotesRepo;
    Reflect.set(repo, 'db', dbStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a random candidate when available', async () => {
    cteQueryBuilder.executeTakeFirst.mockResolvedValue({
      quote_id: 'picked',
    });

    const result = await repo.pickRandomQuoteId();

    expect(candidateBuilder.where.mock.calls[0]).toEqual([
      'quote_stats.likes_count',
      '>',
      0,
    ]);
    expect(cteQueryBuilder.orderBy).toHaveBeenCalledWith(sql`RANDOM()`);
    expect(cteQueryBuilder.limit).toHaveBeenCalledWith(1);
    expect(result).toBe('picked');
  });

  it('applies exclusion filters when provided', async () => {
    cteQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

    const result = await repo.pickRandomQuoteId({
      excludeQuoteIds: ['a', 'b'],
    });

    expect(candidateBuilder.where.mock.calls[1]).toEqual([
      'quote_stats.quote_id',
      'not in',
      ['a', 'b'],
    ]);
    expect(result).toBeNull();
  });
});
