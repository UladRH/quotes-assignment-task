import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`.execute(db);
}

export async function down(): Promise<void> {
  // pass
}
