import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { sql, type Kysely } from 'kysely';
import { toSql as vectorToSql } from 'pgvector/pg';

const DEFAULT_EMBEDDINGS_PATH =
  'pregenerated-data/embeddinggemma_by_quote_id.json';
const CHUNK_SIZE = 100;

export async function seed(db: Kysely<any>): Promise<void> {
  const embeddingsPath =
    process.env.EMBEDDINGS_SOURCE ?? DEFAULT_EMBEDDINGS_PATH;

  console.log(`Loading embeddings from ${embeddingsPath}`);
  const rawData = await readFile(embeddingsPath, 'utf-8');
  const parsed = JSON.parse(rawData) as Record<string, number[]>;
  const entries = Object.entries(parsed);

  if (!entries.length) {
    console.log('No embeddings found in source file; nothing to seed.');
    return;
  }

  let processed = 0;

  for (let index = 0; index < entries.length; index += CHUNK_SIZE) {
    const chunk = entries.slice(index, index + CHUNK_SIZE);
    const tuples = chunk.map(([quoteId, embedding]) => ({
      quote_id: quoteId,
      embedding: vectorToSql(embedding) as unknown,
    }));

    await db
      .insertInto('embeddinggemma_by_quote_id')
      .values(tuples)
      .onConflict((oc) =>
        oc.column('quote_id').doUpdateSet({
          embedding: sql`EXCLUDED.embedding`,
        }),
      )
      .execute();

    processed += chunk.length;
    console.log(`Stored embeddings: ${processed} of ${entries.length}`);
  }

  console.log('Embedding seed complete.');
}
