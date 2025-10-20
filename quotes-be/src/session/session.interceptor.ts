import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { getFastifyRequestFromContext } from './request-context.util';
import { SessionService } from './session.service';
import { QuSession } from './session.types';

@Injectable()
export class SessionInitializationInterceptor implements NestInterceptor {
  constructor(private readonly sessionService: SessionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = getFastifyRequestFromContext(context);

    if (!request?.session) {
      return next.handle();
    }

    this.sessionService.ensureInitialized(request.session as QuSession);

    return next.handle();
  }
}
