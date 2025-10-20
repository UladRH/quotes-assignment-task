import { Kysely } from 'kysely';
import { defineConfig } from 'kysely-ctl';
import { NestFactory } from '@nestjs/core';
import { KYSELY_MODULE_CONNECTION_TOKEN } from 'nestjs-kysely';

import { AppModule } from '../src/app.module';

const app = await NestFactory.create(AppModule);

const kyselyInstance = app.get(
  KYSELY_MODULE_CONNECTION_TOKEN(),
) as Kysely<unknown>;

export default defineConfig({
  kysely: kyselyInstance,
});
