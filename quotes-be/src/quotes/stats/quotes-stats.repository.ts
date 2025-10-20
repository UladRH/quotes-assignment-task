import { Injectable } from '@nestjs/common';
import { ColumnType, Kysely, Transaction, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

type QuoteStatsTable = {
  quote_id: ColumnType<string, string, never>;
  likes_count: ColumnType<number, number | undefined, number>;
  impressions_count: ColumnType<number, number | undefined, number>;
};

type UserLikedQuotesTable = {
  user_id: string;
  quote_id: ColumnType<string, string, never>;
  liked_at: ColumnType<Date, Date | undefined, Date>;
};

type Database = {
  quote_stats: QuoteStatsTable;
  user_liked_quotes: UserLikedQuotesTable;
};

type DatabaseExecutor = Kysely<Database> | Transaction<Database>;

type MutationArgs = {
  actorUserId: string;
  targetQuoteId: string;
};

type MutationResult = {
  likesCount: number;
  impressionsCount: number;
  changed: boolean;
};

@Injectable()
export class QuotesStatsRepo {
  constructor(@InjectKysely() private readonly db: Kysely<Database>) {}

  async likeQuote({
    actorUserId,
    targetQuoteId,
  }: MutationArgs): Promise<MutationResult> {
    return this.db.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto('user_liked_quotes')
        .values({ user_id: actorUserId, quote_id: targetQuoteId })
        .onConflict((oc) => oc.columns(['user_id', 'quote_id']).doNothing())
        .returning('user_id')
        .executeTakeFirst();

      if (!inserted) {
        const stats = await this.getQuoteStats(trx, targetQuoteId);
        return { ...stats, changed: false };
      }

      await trx
        .insertInto('quote_stats')
        .values({ quote_id: targetQuoteId, likes_count: 1 })
        .onConflict((oc) =>
          oc.column('quote_id').doUpdateSet({
            likes_count: sql<number>`quote_stats.likes_count + 1`,
          }),
        )
        .execute();

      const stats = await this.getQuoteStats(trx, targetQuoteId);
      return { ...stats, changed: true };
    });
  }

  async unlikeQuote({
    actorUserId,
    targetQuoteId,
  }: MutationArgs): Promise<MutationResult> {
    return this.db.transaction().execute(async (trx) => {
      const deleted = await trx
        .deleteFrom('user_liked_quotes')
        .where('user_id', '=', actorUserId)
        .where('quote_id', '=', targetQuoteId)
        .returning('user_id')
        .executeTakeFirst();

      if (!deleted) {
        const stats = await this.getQuoteStats(trx, targetQuoteId);
        return { ...stats, changed: false };
      }

      await trx
        .updateTable('quote_stats')
        .set({ likes_count: sql<number>`GREATEST(likes_count - 1, 0)` })
        .where('quote_id', '=', targetQuoteId)
        .execute();

      const stats = await this.getQuoteStats(trx, targetQuoteId);
      return { ...stats, changed: true };
    });
  }

  async incrementImpressionsCount(quoteId: string): Promise<void> {
    await this.db
      .insertInto('quote_stats')
      .values({ quote_id: quoteId, impressions_count: 1 })
      .onConflict((oc) =>
        oc.column('quote_id').doUpdateSet({
          impressions_count: sql<number>`quote_stats.impressions_count + 1`,
        }),
      )
      .execute();
  }

  private async getQuoteStats(
    executor: DatabaseExecutor,
    quoteId: string,
  ): Promise<{ likesCount: number; impressionsCount: number }> {
    const row = await executor
      .selectFrom('quote_stats')
      .select(['likes_count', 'impressions_count'])
      .where('quote_id', '=', quoteId)
      .executeTakeFirst();

    return {
      likesCount: row?.likes_count ?? 0,
      impressionsCount: row?.impressions_count ?? 0,
    };
  }
}
