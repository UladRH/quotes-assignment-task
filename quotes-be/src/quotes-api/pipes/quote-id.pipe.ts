import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class QuoteIdPipe implements PipeTransform {
  transform(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('quoteId must be a string');
    }

    const trimmedValue = value.trim();

    if (!/^[1-9]\d*$/.test(trimmedValue)) {
      throw new BadRequestException(
        'quoteId must be a positive integer string',
      );
    }

    return trimmedValue;
  }
}
