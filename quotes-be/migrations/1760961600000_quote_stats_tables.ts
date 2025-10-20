import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('quote_stats')
    .addColumn('quote_id', 'varchar(255)', (col) => col.notNull().primaryKey())
    .addColumn('likes_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('impressions_count', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addCheckConstraint(
      'ck_quote_stats_likes_count_non_negative',
      sql`likes_count >= 0`,
    )
    .addCheckConstraint(
      'ck_quote_stats_impressions_count_non_negative',
      sql`impressions_count >= 0`,
    )
    .execute();

  await db.schema
    .createTable('user_liked_quotes')
    .addColumn('user_id', 'uuid', (col) => col.notNull())
    .addColumn('quote_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('liked_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('pk_user_liked_quotes', ['user_id', 'quote_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('user_liked_quotes').execute();
  await db.schema.dropTable('quote_stats').execute();
}
