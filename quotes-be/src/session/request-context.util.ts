import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { FastifyRequest } from 'fastify';

export function getFastifyRequestFromContext(
  context: ExecutionContext,
): FastifyRequest | undefined {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest<FastifyRequest>();
  }

  if (context.getType<'graphql'>() === 'graphql') {
    const gqlContext = GqlExecutionContext.create(context);
    const contextValue = gqlContext.getContext<{
      req?: FastifyRequest;
      request?: FastifyRequest;
      reply?: { request: FastifyRequest };
    }>();

    return (
      contextValue.req ?? contextValue.request ?? contextValue.reply?.request
    );
  }

  return undefined;
}
