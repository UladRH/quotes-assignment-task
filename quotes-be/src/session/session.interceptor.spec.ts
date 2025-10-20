import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { getFastifyRequestFromContext } from './request-context.util';
import { SessionInitializationInterceptor } from './session.interceptor';
import { SessionService } from './session.service';
import { QuSession } from './session.types';

jest.mock('./request-context.util', () => ({
  getFastifyRequestFromContext: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('SessionInitializationInterceptor', () => {
  let interceptor: SessionInitializationInterceptor;
  let sessionServiceMock: { ensureInitialized: jest.Mock };
  let callHandlerMock: { handle: jest.Mock };
  const getRequestMock = getFastifyRequestFromContext as jest.Mock;

  beforeEach(() => {
    sessionServiceMock = { ensureInitialized: jest.fn() };
    interceptor = new SessionInitializationInterceptor(
      sessionServiceMock as unknown as SessionService,
    );
    callHandlerMock = { handle: jest.fn(() => of('ok')) };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes through when request has no session', async () => {
    getRequestMock.mockReturnValue(undefined);

    const observable = interceptor.intercept(
      {} as ExecutionContext,
      callHandlerMock as unknown as CallHandler,
    );

    await expect(lastValueFrom(observable)).resolves.toBe('ok');
    expect(sessionServiceMock.ensureInitialized).not.toHaveBeenCalled();
    expect(callHandlerMock.handle).toHaveBeenCalledTimes(1);
  });

  it('initializes session when present on request', async () => {
    const session = { get: jest.fn(), set: jest.fn() } as unknown as QuSession;
    getRequestMock.mockReturnValue({ session });

    const observable = interceptor.intercept(
      {} as ExecutionContext,
      callHandlerMock as unknown as CallHandler,
    );

    await expect(lastValueFrom(observable)).resolves.toBe('ok');
    expect(sessionServiceMock.ensureInitialized).toHaveBeenCalledWith(session);
    expect(callHandlerMock.handle).toHaveBeenCalledTimes(1);
  });
});
