import { UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { SessionService } from './session.service';
import { QuSession } from './session.types';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('SessionService', () => {
  let service: SessionService;
  const fixedIsoDate = '2025-01-02T03:04:05.000Z';

  const createSession = (
    initial: Record<string, unknown> = {},
  ): {
    session: QuSession;
    store: Map<string, unknown>;
    getMock: jest.Mock;
    setMock: jest.Mock;
  } => {
    const store = new Map<string, unknown>(Object.entries(initial));
    const getMock = jest.fn((key: string) => store.get(key));
    const setMock = jest.fn((key: string, value: unknown) => {
      store.set(key, value);
    });

    return {
      session: {
        get: getMock,
        set: setMock,
      } as unknown as QuSession,
      store,
      getMock,
      setMock,
    };
  };

  beforeEach(() => {
    service = new SessionService();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(fixedIsoDate));
    (uuidv4 as jest.Mock).mockReturnValue('uuid-123');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('ensureInitialized', () => {
    it('skips initialization when session is not available', () => {
      expect(() => service.ensureInitialized(undefined)).not.toThrow();
    });

    it('initializes missing session fields', () => {
      const { session, store, setMock } = createSession();

      service.ensureInitialized(session);

      expect(setMock).toHaveBeenCalledTimes(4);
      expect(store.get('userId')).toBe('uuid-123');
      expect(store.get('firstVisitDate')).toBe(fixedIsoDate);
      expect(store.get('rolledRandomQuotesCount')).toBe(0);
      expect(store.get('recentRolledQuoteIds')).toEqual([]);
    });

    it('preserves existing session fields', () => {
      const initial = {
        userId: 'existing-user',
        firstVisitDate: '2024-12-01T00:00:00.000Z',
        rolledRandomQuotesCount: 5,
        recentRolledQuoteIds: ['a'],
      };
      const { session, setMock } = createSession(initial);

      service.ensureInitialized(session);

      expect(setMock).not.toHaveBeenCalled();
    });
  });

  describe('getSessionUserId', () => {
    it('throws when session is missing', () => {
      expect(() => service.getSessionUserId(null)).toThrow(
        new UnauthorizedException('Session is not available on request'),
      );
    });

    it('throws when userId is missing', () => {
      const { session } = createSession();

      expect(() => service.getSessionUserId(session)).toThrow(
        new UnauthorizedException('User session is not initialized'),
      );
    });

    it('returns the user id when present', () => {
      const { session } = createSession({ userId: 'user-42' });

      expect(service.getSessionUserId(session)).toBe('user-42');
    });
  });

  describe('getRecentRolledQuoteIds', () => {
    it('throws when session is missing', () => {
      expect(() => service.getRecentRolledQuoteIds(undefined)).toThrow(
        new UnauthorizedException('Session is not available on request'),
      );
    });

    it('returns an empty array when value is not an array', () => {
      const { session } = createSession({ recentRolledQuoteIds: 'not-array' });

      expect(service.getRecentRolledQuoteIds(session)).toEqual([]);
    });

    it('returns stored recent ids', () => {
      const ids = ['1', '2'];
      const { session } = createSession({ recentRolledQuoteIds: ids });

      expect(service.getRecentRolledQuoteIds(session)).toEqual(ids);
    });
  });

  describe('getRolledRandomQuotesCount', () => {
    it('throws when session is missing', () => {
      expect(() => service.getRolledRandomQuotesCount(null)).toThrow(
        new UnauthorizedException('Session is not available on request'),
      );
    });

    it('returns null when the stored value is not a finite number', () => {
      const { session } = createSession({ rolledRandomQuotesCount: 'oops' });

      expect(service.getRolledRandomQuotesCount(session)).toBeNull();
    });

    it('returns stored count when valid', () => {
      const { session } = createSession({ rolledRandomQuotesCount: 7 });

      expect(service.getRolledRandomQuotesCount(session)).toBe(7);
    });
  });

  describe('addRecentRolledQuoteId', () => {
    it('throws when session is missing', () => {
      expect(() =>
        service.addRecentRolledQuoteId({ session: undefined, quoteId: 'q1' }),
      ).toThrow(
        new UnauthorizedException('Session is not available on request'),
      );
    });

    it('appends quote id and increments count', () => {
      const { session, store, setMock } = createSession({
        recentRolledQuoteIds: ['old'],
        rolledRandomQuotesCount: 2,
      });

      service.addRecentRolledQuoteId({ session, quoteId: 'new' });

      expect(setMock).toHaveBeenCalledWith('recentRolledQuoteIds', [
        'old',
        'new',
      ]);
      expect(setMock).toHaveBeenCalledWith('rolledRandomQuotesCount', 3);
      expect(store.get('recentRolledQuoteIds')).toEqual(['old', 'new']);
      expect(store.get('rolledRandomQuotesCount')).toBe(3);
    });

    it('moves existing id to the end without duplication', () => {
      const { session, store } = createSession({
        recentRolledQuoteIds: ['a', 'b', 'c'],
        rolledRandomQuotesCount: 0,
      });

      service.addRecentRolledQuoteId({ session, quoteId: 'b' });

      expect(store.get('recentRolledQuoteIds')).toEqual(['a', 'c', 'b']);
    });

    it('trims history beyond the configured limit', () => {
      const limit = 20;
      const initialIds = Array.from(
        { length: limit },
        (_, index) => `id-${index}`,
      );
      const { session, store } = createSession({
        recentRolledQuoteIds: initialIds,
        rolledRandomQuotesCount: 0,
      });

      service.addRecentRolledQuoteId({ session, quoteId: 'overflow' });

      const updatedIds = store.get('recentRolledQuoteIds') as string[];
      expect(updatedIds).toHaveLength(limit);
      expect(updatedIds[updatedIds.length - 1]).toBe('overflow');
      expect(updatedIds).not.toContain('id-0');
    });

    it('initializes counter when missing', () => {
      const { session, store } = createSession({
        recentRolledQuoteIds: [],
      });

      service.addRecentRolledQuoteId({ session, quoteId: 'first' });

      expect(store.get('rolledRandomQuotesCount')).toBe(1);
    });
  });
});
