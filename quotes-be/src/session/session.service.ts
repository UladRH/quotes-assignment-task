import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { APP_PARAMS } from '../app-params';
import { QuSession } from './session.types';

const RECENT_HISTORY_LIMIT = APP_PARAMS.session.recentHistoryLimit;

@Injectable()
export class SessionService {
  ensureInitialized(session?: QuSession | null): void {
    if (!session) {
      return;
    }

    if (!session.get('userId')) {
      session.set('userId', uuidv4());
    }

    if (!session.get('firstVisitDate')) {
      session.set('firstVisitDate', new Date().toISOString());
    }

    if (!session.get('rolledRandomQuotesCount')) {
      session.set('rolledRandomQuotesCount', 0);
    }

    if (!Array.isArray(session.get('recentRolledQuoteIds'))) {
      session.set('recentRolledQuoteIds', []);
    }
  }

  getSessionUserId(session: QuSession | undefined | null): string {
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    const userId = session.get('userId');

    if (typeof userId !== 'string' || !userId.length) {
      throw new UnauthorizedException('User session is not initialized');
    }

    return userId;
  }

  getRecentRolledQuoteIds(session: QuSession | undefined | null): string[] {
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    const recent = session.get('recentRolledQuoteIds');
    if (!Array.isArray(recent)) {
      return [];
    }

    return recent;
  }

  getRolledRandomQuotesCount(
    session: QuSession | undefined | null,
  ): number | null {
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    const count = session.get('rolledRandomQuotesCount');
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      return null;
    }

    return count;
  }

  addRecentRolledQuoteId({
    session,
    quoteId,
  }: {
    session: QuSession | undefined | null;
    quoteId: string;
  }): void {
    if (!session) {
      throw new UnauthorizedException('Session is not available on request');
    }

    const recent = this.getRecentRolledQuoteIds(session);
    const withoutCurrent = recent.filter((id) => id !== quoteId);
    withoutCurrent.push(quoteId);

    const overflow = Math.max(0, withoutCurrent.length - RECENT_HISTORY_LIMIT);
    const updatedRecentIds = overflow
      ? withoutCurrent.slice(overflow)
      : withoutCurrent;

    session.set('recentRolledQuoteIds', updatedRecentIds);

    const currentCount = session.get('rolledRandomQuotesCount') ?? 0;

    session.set('rolledRandomQuotesCount', currentCount + 1);
  }
}
