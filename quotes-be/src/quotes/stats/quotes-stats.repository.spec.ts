import { Kysely } from 'kysely';

import { QuotesStatsRepo } from './quotes-stats.repository';

type QuoteStatsTable = {
  quote_id: string;
  likes_count: number;
  impressions_count: number;
};

type UserLikedQuotesTable = {
  user_id: string;
  quote_id: string;
  liked_at: Date;
};

type Database = {
  quote_stats: QuoteStatsTable;
  user_liked_quotes: UserLikedQuotesTable;
};

type Builder<TExecute = unknown> = {
  execute: jest.Mock<Promise<TExecute>>;
};

type ExecuteFirstBuilder<TExecute = unknown> = {
  executeTakeFirst: jest.Mock<Promise<TExecute>>;
};

type InsertBuilder = {
  values: jest.Mock;
  onConflict: jest.Mock;
  returning?: jest.Mock;
} & (Builder<void> & ExecuteFirstBuilder<unknown>);

type DeleteBuilder = {
  where: jest.Mock;
  returning: jest.Mock;
} & ExecuteFirstBuilder<unknown>;

type UpdateBuilder = {
  set: jest.Mock;
  where: jest.Mock;
} & Builder<void>;

type SelectBuilder = {
  select: jest.Mock;
  where: jest.Mock;
} & ExecuteFirstBuilder<
  | {
      likes_count?: number;
      impressions_count?: number;
    }
  | undefined
>;

type RepoMocks = {
  userLikedInsert: InsertBuilder;
  quoteStatsInsert: InsertBuilder;
  quoteStatsDelete: DeleteBuilder;
  quoteStatsUpdate: UpdateBuilder;
  quoteStatsSelect: SelectBuilder;
  outsideInsert: InsertBuilder;
  db: jest.Mocked<Kysely<Database>>;
  dbInsertInto: jest.Mock;
};

const createInsertBuilder = (
  options: {
    withReturning?: boolean;
    conflictMode?: 'columns' | 'column';
  } = {},
): InsertBuilder => {
  const builder: Partial<InsertBuilder> = {};
  builder.values = jest.fn().mockReturnValue(builder);
  builder.onConflict = jest.fn(
    (callback: (helpers: Record<string, unknown>) => void) => {
      if (options.conflictMode === 'columns') {
        callback({
          columns: jest.fn().mockReturnValue({
            doNothing: jest.fn(),
          }),
        });
      } else if (options.conflictMode === 'column') {
        callback({
          column: jest.fn().mockReturnValue({
            doUpdateSet: jest.fn().mockReturnValue(undefined),
          }),
        });
      }
      return builder;
    },
  );
  if (options.withReturning) {
    builder.returning = jest.fn().mockReturnValue(builder);
  }
  builder.executeTakeFirst = jest.fn();
  builder.execute = jest.fn();
  return builder as InsertBuilder;
};

const createDeleteBuilder = (): DeleteBuilder => {
  const builder: Partial<DeleteBuilder> = {};
  builder.where = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn().mockReturnValue(builder);
  builder.executeTakeFirst = jest.fn();
  return builder as DeleteBuilder;
};

const createUpdateBuilder = (): UpdateBuilder => {
  const builder: Partial<UpdateBuilder> = {};
  builder.set = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.execute = jest.fn();
  return builder as UpdateBuilder;
};

const createSelectBuilder = (): SelectBuilder => {
  const builder: Partial<SelectBuilder> = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.executeTakeFirst = jest.fn();
  return builder as SelectBuilder;
};

const setupRepo = (): { repo: QuotesStatsRepo } & RepoMocks => {
  const userLikedInsert = createInsertBuilder({
    withReturning: true,
    conflictMode: 'columns',
  });
  const quoteStatsInsert = createInsertBuilder({ conflictMode: 'column' });
  const quoteStatsDelete = createDeleteBuilder();
  const quoteStatsUpdate = createUpdateBuilder();
  const quoteStatsSelect = createSelectBuilder();
  const outsideInsert = createInsertBuilder({ conflictMode: 'column' });

  const trx = {
    insertInto: jest.fn((table: string) => {
      if (table === 'user_liked_quotes') {
        return userLikedInsert;
      }
      if (table === 'quote_stats') {
        return quoteStatsInsert;
      }
      throw new Error(`Unexpected table ${table}`);
    }),
    deleteFrom: jest.fn((table: string) => {
      if (table !== 'user_liked_quotes') {
        throw new Error(`Unexpected delete table ${table}`);
      }
      return quoteStatsDelete;
    }),
    updateTable: jest.fn((table: string) => {
      if (table !== 'quote_stats') {
        throw new Error(`Unexpected update table ${table}`);
      }
      return quoteStatsUpdate;
    }),
    selectFrom: jest.fn(() => quoteStatsSelect),
  };

  const transactionMock = jest.fn().mockReturnValue({
    execute: <T>(callback: (trxExecutor: typeof trx) => Promise<T>) =>
      callback(trx) as unknown as Promise<T>,
  });
  const insertIntoMock = jest.fn(() => outsideInsert);

  const dbMock = {
    transaction: transactionMock,
    insertInto: insertIntoMock,
  } as unknown as jest.Mocked<Kysely<Database>>;

  const repo = new QuotesStatsRepo(dbMock);

  return {
    repo,
    userLikedInsert,
    quoteStatsInsert,
    quoteStatsDelete,
    quoteStatsUpdate,
    quoteStatsSelect,
    outsideInsert,
    db: dbMock,
    dbInsertInto: insertIntoMock,
  };
};

describe('QuotesStatsRepo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('likes a quote and records stats when the user likes for the first time', async () => {
    const mocks = setupRepo();
    mocks.userLikedInsert.executeTakeFirst.mockResolvedValue({
      user_id: 'user',
    });
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue({
      likes_count: 5,
      impressions_count: 10,
    });

    const result = await mocks.repo.likeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-1',
    });

    expect(mocks.quoteStatsInsert.execute).toHaveBeenCalled();
    expect(result).toEqual({
      likesCount: 5,
      impressionsCount: 10,
      changed: true,
    });
  });

  it('returns existing stats when the like already exists', async () => {
    const mocks = setupRepo();
    mocks.userLikedInsert.executeTakeFirst.mockResolvedValue(undefined);
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue({
      likes_count: 7,
      impressions_count: 11,
    });

    const result = await mocks.repo.likeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-2',
    });

    expect(mocks.quoteStatsInsert.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      likesCount: 7,
      impressionsCount: 11,
      changed: false,
    });
  });

  it('gracefully handles missing stats when like already exists', async () => {
    const mocks = setupRepo();
    mocks.userLikedInsert.executeTakeFirst.mockResolvedValue(undefined);
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue(undefined);

    const result = await mocks.repo.likeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-3',
    });

    expect(result).toEqual({
      likesCount: 0,
      impressionsCount: 0,
      changed: false,
    });
  });

  it('unlikes a quote and decrements stats when a like is removed', async () => {
    const mocks = setupRepo();
    mocks.quoteStatsDelete.executeTakeFirst.mockResolvedValue({
      user_id: 'user',
    });
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue({
      likes_count: 4,
      impressions_count: 8,
    });

    const result = await mocks.repo.unlikeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-1',
    });

    expect(mocks.quoteStatsUpdate.execute).toHaveBeenCalled();
    expect(result).toEqual({
      likesCount: 4,
      impressionsCount: 8,
      changed: true,
    });
  });

  it('returns existing stats when unlike does not change anything', async () => {
    const mocks = setupRepo();
    mocks.quoteStatsDelete.executeTakeFirst.mockResolvedValue(undefined);
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue({
      likes_count: 2,
      impressions_count: 6,
    });

    const result = await mocks.repo.unlikeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-4',
    });

    expect(mocks.quoteStatsUpdate.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      likesCount: 2,
      impressionsCount: 6,
      changed: false,
    });
  });

  it('gracefully handles missing stats when unlike does not change anything', async () => {
    const mocks = setupRepo();
    mocks.quoteStatsDelete.executeTakeFirst.mockResolvedValue(undefined);
    mocks.quoteStatsSelect.executeTakeFirst.mockResolvedValue(undefined);

    const result = await mocks.repo.unlikeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote-5',
    });

    expect(result).toEqual({
      likesCount: 0,
      impressionsCount: 0,
      changed: false,
    });
  });

  it('increments impressions count using an upsert', async () => {
    const mocks = setupRepo();

    await mocks.repo.incrementImpressionsCount('quote-7');

    expect(mocks.dbInsertInto).toHaveBeenCalledWith('quote_stats');
    expect(mocks.outsideInsert.values).toHaveBeenCalledWith({
      quote_id: 'quote-7',
      impressions_count: 1,
    });
    expect(mocks.outsideInsert.execute).toHaveBeenCalled();
  });
});
