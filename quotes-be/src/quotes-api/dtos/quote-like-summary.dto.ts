import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const QuoteLikeSummarySchema = z.object({
  quoteId: z.string().meta({ example: '42' }),
  likesCount: z.number().int().nonnegative().meta({ example: 7 }),
  impressionsCount: z.number().int().nonnegative().meta({ example: 120 }),
  isLiked: z.boolean().meta({ example: true }),
  changed: z.boolean().meta({ example: true }),
});

export class QuoteLikeSummaryDto extends createZodDto(QuoteLikeSummarySchema) {}
