import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

interface EmbeddingGemmaByQuoteIdTable {
  quote_id: string;
  embedding: unknown;
}

interface Database {
  embeddinggemma_by_quote_id: EmbeddingGemmaByQuoteIdTable;
}

@Injectable()
export class SimilarQuotesRepo {
  constructor(@InjectKysely() private readonly db: Kysely<Database>) {}

  async findSimilarQuoteIds({
    quoteId,
    limit,
  }: {
    quoteId: string;
    limit: number;
  }): Promise<string[]> {
    if (!limit) {
      return [];
    }

    const targetQuoteId = quoteId.toString();

    const result = await this.db
      .selectFrom('embeddinggemma_by_quote_id as target')
      .innerJoin('embeddinggemma_by_quote_id as other', (join) =>
        join.onRef('other.quote_id', '!=', 'target.quote_id'),
      )
      .select(['other.quote_id'])
      .where('target.quote_id', '=', targetQuoteId)
      .orderBy(sql`other.embedding <-> target.embedding`)
      .limit(limit)
      .execute();

    return result.map((row) => row.quote_id);
  }
}
