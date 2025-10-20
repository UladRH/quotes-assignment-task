import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { QU_REQUIRE_SESSION_METADATA_KEY } from './qu-require-session.decorator';
import { getFastifyRequestFromContext } from './request-context.util';
import { QuSession } from './session.types';

@Injectable()
export class SessionUserGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresSession = this.reflector.getAllAndOverride<boolean>(
      QU_REQUIRE_SESSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresSession) {
      return true;
    }

    const request = getFastifyRequestFromContext(context);

    if (!request) {
      throw new UnauthorizedException('Request is not available on context');
    }

    const session = request.session as QuSession | undefined;

    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    const userId = session.get('userId');

    if (typeof userId !== 'string' || !userId.length) {
      throw new UnauthorizedException('User session is not initialized');
    }

    return true;
  }
}
