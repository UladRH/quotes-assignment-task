import { Module } from '@nestjs/common';

import { QuotesApiService } from './quotes-api.service';
import { QuotesModule } from '../quotes/quotes.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [QuotesModule, SessionModule],
  providers: [QuotesApiService],
  exports: [QuotesApiService],
})
export class QuotesApiModule {}
