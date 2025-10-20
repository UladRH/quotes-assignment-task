import { Module } from '@nestjs/common';

import { QuotesRestApiController } from './quotes-rest-api.controller';
import { QuotesApiModule } from '../quotes-api/quotes-api.module';

@Module({
  imports: [QuotesApiModule],
  controllers: [QuotesRestApiController],
})
export class QuotesRestApiModule {}
