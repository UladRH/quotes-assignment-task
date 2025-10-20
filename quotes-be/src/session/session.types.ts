import { Session as FastifySession } from '@fastify/secure-session';

export interface SessionPayload {
  userId: string;
  firstVisitDate: string;
  rolledRandomQuotesCount: number;
  recentRolledQuoteIds: string[];
}

export type QuSession = FastifySession<SessionPayload>;
