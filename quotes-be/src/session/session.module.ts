import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { SessionUserGuard } from './session-user.guard';
import { SessionInitializationInterceptor } from './session.interceptor';
import { SessionService } from './session.service';

@Module({
  providers: [
    SessionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SessionInitializationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: SessionUserGuard,
    },
    SessionUserGuard,
  ],
  exports: [SessionService, SessionUserGuard],
})
export class SessionModule {}
