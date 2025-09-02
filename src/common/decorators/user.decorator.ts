import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export type JwtUser = { userId: string; email: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const req = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user: JwtUser }>();
    return req.user;
  },
);
