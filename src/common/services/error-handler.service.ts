import { Injectable, Logger } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

interface DatabaseError {
  code: string;
  message?: string;
}

interface AuthError {
  name: string;
  message?: string;
}

interface LoggableError {
  message: string;
  stack?: string;
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  handleValidationError(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      const constraints = (error as { constraints?: Record<string, string> })
        .constraints;
      if (
        constraints &&
        typeof constraints === 'object' &&
        !Array.isArray(constraints)
      ) {
        const values = Object.values(constraints);
        if (Array.isArray(values)) {
          messages.push(...values);
        }
      }
      const children = (error as { children?: ValidationError[] }).children;
      if (children && Array.isArray(children)) {
        messages.push(...this.handleValidationError(children));
      }
    }

    return messages;
  }

  handleDatabaseError(error: unknown): { message: string; code: string } {
    this.logger.error('Database error:', error);

    const dbError = error as DatabaseError;
    switch (dbError.code) {
      case 'P2002':
        return { message: 'Resource already exists', code: 'DUPLICATE_ENTRY' };
      case 'P2025':
        return { message: 'Resource not found', code: 'NOT_FOUND' };
      case 'P2003':
        return { message: 'Invalid reference', code: 'INVALID_REFERENCE' };
      default:
        return { message: 'Database error occurred', code: 'DATABASE_ERROR' };
    }
  }

  handleAuthError(error: unknown): { message: string; code: string } {
    this.logger.error('Authentication error:', error);

    const authError = error as AuthError;
    if (authError.name === 'UnauthorizedException') {
      return { message: 'Unauthorized access', code: 'UNAUTHORIZED' };
    }

    return { message: 'Authentication failed', code: 'AUTH_ERROR' };
  }

  logError(
    context: string,
    error: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const loggableError = error as LoggableError;
    this.logger.error(
      `${context}: ${loggableError.message || 'Unknown error'}`,
      {
        error: loggableError.stack,
        metadata,
        timestamp: new Date().toISOString(),
      },
    );
  }
}
