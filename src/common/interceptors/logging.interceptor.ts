import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';

interface LogMetadata {
  method: string;
  url: string;
  duration: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = req;
    const startTime = Date.now();

    // Извлекаем дополнительную информацию
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = req.user?.id;

    const metadata: LogMetadata = {
      method,
      url,
      duration: 0,
      userAgent,
      ip,
      userId,
    };

    this.logger.log(`Request started`, metadata);

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const duration = Date.now() - startTime;
          metadata.duration = duration;
          metadata.statusCode = 200;

          this.logger.log(`Request completed successfully`, metadata);
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          metadata.duration = duration;
          metadata.statusCode = (error as { status?: number })['status'] || 500;

          this.logger.error(`Request failed`, {
            ...metadata,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
