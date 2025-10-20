import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ExternalApiQuotesFacadeService } from './external-quotes-facade.service';
import { HighRatedQuotesService, HighRatedQuotesRepo } from './high-rated';
import { QuotesService } from './quotes.service';
import { SimilarQuotesService, SimilarQuotesRepo } from './similar';
import { QuotesStatsService, QuotesStatsRepo } from './stats';
import { DummyJsonQuotesModule } from '../external-api-clients/dummyjson-quotes';

@Module({
  imports: [
    DummyJsonQuotesModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.get<string>('DUMMYJSON_BASE_API_URL'),
      }),
    }),
    //
  ],
  providers: [
    QuotesService,
    ExternalApiQuotesFacadeService,
    SimilarQuotesService,
    SimilarQuotesRepo,
    QuotesStatsService,
    QuotesStatsRepo,
    HighRatedQuotesService,
    HighRatedQuotesRepo,
  ],
  exports: [QuotesService],
})
export class QuotesModule {}
