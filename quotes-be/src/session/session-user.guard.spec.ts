import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { QU_REQUIRE_SESSION_METADATA_KEY } from './qu-require-session.decorator';
import { getFastifyRequestFromContext } from './request-context.util';
import { SessionUserGuard } from './session-user.guard';
import { QuSession } from './session.types';

jest.mock('./request-context.util', () => ({
  getFastifyRequestFromContext: jest.fn(),
}));

describe('SessionUserGuard', () => {
  let guard: SessionUserGuard;
  let reflectorMock: { getAllAndOverride: jest.Mock };
  const getRequestMock = getFastifyRequestFromContext as jest.Mock;
  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    };

    guard = new SessionUserGuard(reflectorMock as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when handler does not require a session', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const context = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(getRequestMock).not.toHaveBeenCalled();
  });

  it('throws when request is missing on context', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    getRequestMock.mockReturnValue(undefined);

    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Request is not available on context'),
    );
  });

  it('throws when session is missing', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    getRequestMock.mockReturnValue({});

    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Session is not available on request'),
    );
  });

  it('throws when userId is missing from session', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const sessionMocks = {
      get: jest.fn().mockReturnValue(''),
    };
    getRequestMock.mockReturnValue({
      session: sessionMocks as unknown as QuSession,
    });

    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('User session is not initialized'),
    );
    expect(sessionMocks.get).toHaveBeenCalledWith('userId');
  });

  it('allows access when session is properly initialized', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const sessionMocks = {
      get: jest.fn().mockReturnValue('user-1'),
    };
    getRequestMock.mockReturnValue({
      session: sessionMocks as unknown as QuSession,
    });

    const context = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(sessionMocks.get).toHaveBeenCalledWith('userId');
    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(
      QU_REQUIRE_SESSION_METADATA_KEY,
      [undefined, undefined],
    );
  });
});
