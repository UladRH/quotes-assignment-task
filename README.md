# Quotes Service — Coding Assignment Implementation

This repository contains a production‑style implementation of the assignment to build a quotes web service. It exposes both REST and GraphQL APIs, runs on Fastify (via NestJS Fastify adapter), fetches random quotes from a remote source, lets users like quotes, prioritizes high‑rated quotes for new users, and finds similar quotes using vector embeddings.

- Main service code lives in [`quotes-be/`](quotes-be/)
- Local Postgres (with pgvector) is provided via [`dev.docker-compose.yml`](dev.docker-compose.yml)

## What’s implemented (mapped to the assignment)

Assignment highlights and where they are in the codebase:

- Fastify-based backend with both REST and GraphQL

  - Framework: NestJS on Fastify adapter — [`main.ts`](quotes-be/src/main.ts) (`NestFastifyApplication`)
  - REST API: [`quotes-rest-api/quotes-rest-api.controller.ts`](quotes-be/src/quotes-rest-api/quotes-rest-api.controller.ts)
  - GraphQL API: schema-first [`quotes-graphql-api/quotes.graphql`](quotes-be/src/quotes-graphql-api/quotes.graphql), resolvers [`quotes-graphql-api/`](quotes-be/src/quotes-graphql-api/)

- Random quote from a remote source (every call returns another random one)

  - Remote client: DummyJSON quotes — [`external-api-clients/dummyjson-quotes/`](quotes-be/src/external-api-clients/dummyjson-quotes/)
  - Rolling logic (random vs high ranked): [`quotes/quotes.service.ts`](quotes-be/src/quotes/quotes.service.ts)
  - Tunable params (new user boost, reroll attempts): [`app-params.ts`](quotes-be/src/app-params.ts)

- Like quotes via API and track stats

  - REST endpoints: `POST /quotes/:quoteId/likes`, `DELETE /quotes/:quoteId/likes`
  - GraphQL mutations: `likeQuote`, `unlikeQuote`
  - Stats storage (likes, impressions): [`quotes/stats/`](quotes-be/src/quotes/stats/) with Kysely repos and services

- Prioritize high‑rated quotes for new users

  - Basic automatic session, that created implicitly for any new visitor: [`session/`](quotes-be/src/session/) (secure session guard + interceptor)
  - High‑rated selection (Bayesian smoothing and randomization): [`high-rated/`](quotes-be/src/quotes/high-rated/)
  - Random roll logic with a logic that boost highly rated quotes for new uses: [`quotes/quotes.service.ts`](quotes-be/src/quotes/quotes.service.ts) using [`app-params.ts`](quotes-be/src/app-params.ts)

- Find similar quotes to the current one (vector search)
  - pgvector schema + index: migrations in [`migrations/`](quotes-be/migrations/) (enable extension + embeddings table)
  - Vector search: [`quotes/similar/`](quotes-be/src/quotes/similar/) (Kysely + `<->` distance)
  - Prebuilt embeddings JSON: [`pregenerated-data/embeddinggemma_by_quote_id.json`](quotes-be/pregenerated-data/embeddinggemma_by_quote_id.json)

Testing and documentation:

- Unit tests: services/repos have Jest tests under [`quotes-be/src/`](quotes-be/src/) (`*.spec.ts`)
- E2E tests: [`test/`](quotes-be/test/) (`*.e2e-spec.ts`, REST and GraphQL)
- OpenAPI (Swagger UI): served at `/api`
- GraphQL Playground: served at `/graphiql`

## Tech stack

- Language/runtime: TypeScript, Node.js
- Framework: NestJS on Fastify (`@nestjs/platform-fastify`)
- GraphQL: `@nestjs/mercurius` (Mercurius), schema‑first SDL
- Validation/serialization: `zod` with `nestjs-zod`
- HTTP client: `axios`
- Database: PostgreSQL + `pgvector` extension
- ORM/Query builder: `kysely` with `nestjs-kysely`
- Sessions: `@fastify/secure-session`
- Testing: Jest, Supertest

## Getting started

Prerequisites:

- macOS/Linux with Docker
- Node.js 22+

### 1) Create a .env (root)

The same [`.env`](.env) is used by Docker Compose and the app (loaded from [`app.module.ts`](quotes-be/src/app.module.ts)). Example values are fine for local testing:

```bash
mv .env.example .env
```

### 2) Start PostgreSQL (with pgvector)

From the repo root:

```bash
docker compose -f dev.docker-compose.yml up -d
```

This starts a Postgres 18 image with the pgvector extension enabled (volume‑backed data).

### 3) Install dependencies (backend service)

```bash
cd quotes-be
npm ci
```

### 4) Run DB migrations (and seed embeddings)

Migrations include enabling pgvector and creating the embeddings and stats tables.

```bash
# From quotes-be
npm run kysely migrate latest

# Optional: seed prebuilt embeddings (recommended for evaluation)
# Uses quotes-be/pregenerated-data/embeddinggemma_by_quote_id.json by default
npm run kysely seed run
```

If you prefer to specify the source file explicitly:

```bash
EMBEDDINGS_SOURCE=pregenerated-data/embeddinggemma_by_quote_id.json npm run kysely seed run
```

Default embeddings source: [`pregenerated-data/embeddinggemma_by_quote_id.json`](quotes-be/pregenerated-data/embeddinggemma_by_quote_id.json).

### 5) Start the API

```bash
# From quotes-be
npm run start:dev
```

On startup you’ll see:

- Swagger UI: http://localhost:3000/api
- Swagger JSON: http://localhost:3000/api.json
- GraphQL Playground: http://localhost:3000/graphiql

## Using the APIs

REST examples:

- Get a random quote: `GET /quotes/roll`
- Get by id: `GET /quotes/:quoteId`
- Similar quotes: `GET /quotes/:quoteId/similar?limit=5`
- Like/unlike: `POST /quotes/:quoteId/likes` and `DELETE /quotes/:quoteId/likes`

GraphQL examples (via Playground at `/graphiql`):

```graphql
fragment QuoteFrag on Quote {
  quoteId
  quote
  author
}

query {
  rolledQuote {
    ...QuoteFrag
    similarQuotes {
      ...QuoteFrag
    }
  }
}

mutation {
  likeQuote(quoteId: "1") {
    quoteId
    likesCount
    impressionsCount
    isLiked
    changed
  }
}
```

## Optional: generate embeddings with Ollama

You don’t need this for testing (prebuilt JSON is included), but if you want to regenerate embeddings:

1. Install and run Ollama, then pull the model

```bash
# Install Ollama (see https://ollama.com/download for your OS)
# Then pull the embedding model and ensure the server is running at 11434
ollama pull embeddinggemma:300m
```

2. Generate embeddings JSON

```bash
# From quotes-be
npm run scripts:generate_quote_embeddings
```

3. Seed into Postgres

```bash
# From quotes-be
EMBEDDINGS_SOURCE=pregenerated-data/embeddinggemma_by_quote_id.json npm run kysely seed:run
```

## Tests

From [`quotes-be/`](quotes-be/):

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Why this design (addressing the rubric)

- Creativity: Combines REST and GraphQL, adds likeable quotes, onboarding‑aware randomization, and semantic similarity via pgvector. Playground + Swagger for easy exploration.
- Quality: Automated migrations/seeds, strong validation with Zod, session guard/interceptor, clear config, and automated tests (unit + e2e).
- Structure: Modular NestJS architecture: REST and GraphQL modules, clean domain services ([`quotes/`](quotes-be/src/quotes/)), infrastructure (DB via Kysely), and cross‑cutting session module ([`session/`](quotes-be/src/session/)).

If you’re reviewing this assignment, please start in these files:

- Random roll and feature orchestration: [`quotes/quotes.service.ts`](quotes-be/src/quotes/quotes.service.ts)
- High‑rated selection: [`quotes/high-rated/`](quotes-be/src/quotes/high-rated/)
- Similar quotes (vector search): [`quotes/similar/`](quotes-be/src/quotes/similar/)
- Stats (likes/impressions): [`quotes/stats/`](quotes-be/src/quotes/stats/)
- REST and GraphQL layers: [`quotes-rest-api/`](quotes-be/src/quotes-rest-api/) and [`quotes-graphql-api/`](quotes-be/src/quotes-graphql-api/)
- Remote quotes client: [`external-api-clients/dummyjson-quotes/`](quotes-be/src/external-api-clients/dummyjson-quotes/)

That tour should make it clear the assignment is fully implemented and production‑ready for local evaluation.
