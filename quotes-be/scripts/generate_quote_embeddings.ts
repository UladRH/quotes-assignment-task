import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AppModule } from '../src/app.module';
import {
  DummyJsonQuote,
  DummyJsonQuotesService,
} from '../src/external-api-clients/dummyjson-quotes';

const OUTPUT_PATH = 'pregenerated-data/embeddinggemma_by_quote_id.json';

const OLLAMA_EMBED_URL =
  process.env.OLLAMA_EMBED_URL ?? 'http://localhost:11434/api/embed';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'embeddinggemma:300m';

const PAGE_SIZE = Number.parseInt(process.env.PAGE_SIZE ?? '', 10) || 100;
const CHUNK_SIZE = Number.parseInt(process.env.CHUNK_SIZE ?? '', 10) || 100;

async function createQuotesService(): Promise<{
  app: INestApplicationContext;
  quotesService: DummyJsonQuotesService;
}> {
  const app = await NestFactory.create(AppModule);

  return { app, quotesService: app.get(DummyJsonQuotesService) };
}

async function fetchEmbeddings(quotes: DummyJsonQuote[]): Promise<number[][]> {
  const inputs = quotes.map((quote) => quote.quote);

  const response = await fetch(OLLAMA_EMBED_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, input: inputs }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch embeddings: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as { embeddings?: number[][] };
  if (!payload.embeddings || payload.embeddings.length !== quotes.length) {
    throw new Error('Embedding payload missing data for one or more quotes');
  }

  return payload.embeddings;
}

async function main(): Promise<void> {
  const embeddings: Record<string, number[]> = {};
  const { app, quotesService } = await createQuotesService();
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;
  let processed = 0;

  try {
    while (skip < total) {
      console.log(`Fetching quotes batch starting at offset ${skip}`);
      const page = await quotesService.getQuotes({ limit: PAGE_SIZE, skip });
      if (!page) {
        console.log('No more quotes returned; stopping.');
        break;
      }

      total = page.total ?? total;
      console.log(
        `Fetched ${page.quotes.length} quotes (total reported: ${total}, page size: ${page.limit})`,
      );

      for (let index = 0; index < page.quotes.length; index += CHUNK_SIZE) {
        const chunk = page.quotes.slice(index, index + CHUNK_SIZE);
        console.log(
          `Embedding chunk at offset ${skip + index} with ${chunk.length} quotes`,
        );

        const chunkEmbeddings = await fetchEmbeddings(chunk);
        chunk.forEach((quote, chunkIndex) => {
          embeddings[quote.id.toString()] = chunkEmbeddings[chunkIndex];
        });

        processed += chunk.length;
        const totalLabel = Number.isFinite(total) ? total : '?';
        console.log(`Stored embeddings: ${processed} of ${totalLabel}`);
      }

      skip += page.limit;
      console.log(`Advancing to next offset: ${skip}`);
    }
  } finally {
    await app.close();
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(embeddings), 'utf-8');
  console.log(`Embedding export complete. Output written to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
