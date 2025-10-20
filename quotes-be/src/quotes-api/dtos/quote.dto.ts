import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const QuoteDtoSchema = z.object({
  quoteId: z.string().meta({ example: '123' }),
  quote: z.string().meta({ example: 'I drive' }),
  author: z.string().meta({ example: 'Ryan Gosling' }),
});

export class QuoteDto extends createZodDto(QuoteDtoSchema) {}
