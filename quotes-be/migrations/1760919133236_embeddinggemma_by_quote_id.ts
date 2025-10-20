import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  /**
   * This table intended to store embeddinggemma:300m embeddings with **769** dimensions
   */
  await db.schema
    .createTable('embeddinggemma_by_quote_id')
    .addColumn('quote_id', 'varchar(255)', (col) => col.notNull().primaryKey())
    .addColumn('embedding', sql`vector(768)`, (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_embeddinggemma_by_quote_id_embedding_vector')
    .on('embeddinggemma_by_quote_id')
    .using('hnsw')
    .expression(sql`embedding vector_l2_ops`)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex('idx_embeddinggemma_by_quote_id_embedding_vector')
    .execute();

  await db.schema.dropTable('embeddinggemma_by_quote_id').execute();
}
