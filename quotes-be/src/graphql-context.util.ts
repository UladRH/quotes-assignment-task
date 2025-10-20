import type { FastifyReply, FastifyRequest } from 'fastify';

import type { QuSession } from './session';

export interface MercuriusGraphqlContext {
  req?: FastifyRequest;
  request?: FastifyRequest;
  reply?: FastifyReply & { request: FastifyRequest };
}

export function getSessionFromMercuriusContext(
  context: MercuriusGraphqlContext,
): QuSession | undefined {
  const request = context.req ?? context.request ?? context.reply?.request;

  return request?.session as QuSession | undefined;
}
