import { Catch, HttpException, Logger, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod/v3';

@Catch(HttpException)
export class ZodExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(ZodExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();

      if (zodError instanceof ZodError) {
        this.logger.warn(`ZodSerializationException: ${zodError.message}`);
      }
    }

    if (host.getType() !== 'http') {
      throw exception;
    }

    super.catch(exception, host);
  }
}
