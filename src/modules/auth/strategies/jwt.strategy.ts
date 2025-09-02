import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';

type JwtPayload = { sub: string; email: string };

const jwtFromRequest: JwtFromRequestFunction = (req) => {
  const r = req as { headers?: Record<string, string | string[] | undefined> };
  const auth = r.headers?.authorization;
  if (!auth) return null;
  const value = Array.isArray(auth) ? auth[0] : auth;
  const [scheme, token] = value.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? (token ?? null) : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const options: StrategyOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? '',
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
