import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { APP_PARAMS } from '../../app-params';

const { maxLimit: SIMILAR_QUOTES_MAX_LIMIT } = APP_PARAMS.quotes.similar;

const GetSimilarQuotesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(SIMILAR_QUOTES_MAX_LIMIT)
    .default(SIMILAR_QUOTES_MAX_LIMIT)
    .meta({ example: SIMILAR_QUOTES_MAX_LIMIT }),
});

export class GetSimilarQuotesQueryDto extends createZodDto(
  GetSimilarQuotesQuerySchema,
) {
  static parse(input: unknown): z.infer<typeof GetSimilarQuotesQuerySchema> {
    return GetSimilarQuotesQuerySchema.parse(input);
  }
}

export { GetSimilarQuotesQuerySchema };
