import { Module } from '@nestjs/common';

import { QuotesFieldsGraphqlApiResolver } from './quotes-fields-graphql-api.resolver';
import { QuotesGraphqlApiResolver } from './quotes-graphql-api.resolver';
import { QuotesApiModule } from '../quotes-api/quotes-api.module';

@Module({
  imports: [QuotesApiModule],
  providers: [QuotesGraphqlApiResolver, QuotesFieldsGraphqlApiResolver],
})
export class QuotesGraphqlApiModule {}
