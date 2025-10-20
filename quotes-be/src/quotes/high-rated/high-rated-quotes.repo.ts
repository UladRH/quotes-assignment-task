import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

import { APP_PARAMS } from '../../app-params';

type QuoteStatsTable = {
  quote_id: string;
  likes_count: number;
  impressions_count: number;
};

type Database = {
  quote_stats: QuoteStatsTable;
};

type PickArgs = {
  excludeQuoteIds?: string[];
};

const HIGH_RATED_PARAMS = APP_PARAMS.quotes.highRated;

@Injectable()
export class HighRatedQuotesRepo {
  constructor(@InjectKysely() private readonly db: Kysely<Database>) {}

  async pickRandomQuoteId({ excludeQuoteIds = [] }: PickArgs = {}): Promise<
    string | null
  > {
    const cte = this.db.with('top_candidates', (qb) => {
      let builder = qb
        .selectFrom('quote_stats')
        .select((eb) => [
          eb.ref('quote_stats.quote_id').as('quote_id'),
          eb.ref('quote_stats.likes_count').as('likes_count'),
          eb.ref('quote_stats.impressions_count').as('impressions_count'),
          sql<number>`((quote_stats.likes_count + ${HIGH_RATED_PARAMS.bayesianSmoothing.alpha})::float / (quote_stats.impressions_count + ${HIGH_RATED_PARAMS.bayesianSmoothing.beta}))`.as(
            'score',
          ),
        ])
        .where('quote_stats.likes_count', '>', 0)
        .orderBy('score', 'desc')
        .limit(HIGH_RATED_PARAMS.candidatePoolSize);

      if (excludeQuoteIds.length) {
        builder = builder.where(
          'quote_stats.quote_id',
          'not in',
          excludeQuoteIds,
        );
      }

      return builder;
    });

    const row = await cte
      .selectFrom('top_candidates')
      .selectAll()
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .executeTakeFirst();

    return row?.quote_id ?? null;
  }
}
