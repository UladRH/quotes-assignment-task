// eslint-disable-next-line import-x/no-nodejs-modules
import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { QuotesGraphqlApiModule } from './quotes-graphql-api/quotes-graphql-api.module';
import { QuotesRestApiModule } from './quotes-rest-api/quotes-rest-api.module';
import { SessionModule } from './session/session.module';
import { ZodExceptionFilter } from './zod-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env', '../.env'], isGlobal: true }),

    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(process.cwd(), 'src/**/*.graphql')],
      graphiql: true,
      context: (request, reply) => ({ req: request, reply }),
    }),

    DatabaseModule,
    SessionModule,
    QuotesRestApiModule,
    QuotesGraphqlApiModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },

    AppService,
  ],
})
export class AppModule {}
