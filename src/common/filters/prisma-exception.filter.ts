import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { FastifyReply } from 'fastify';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        break;
      case 'P2003': // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference';
        break;
      case 'P2014': // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid identifier';
        break;
    }

    response.status(status).send({
      statusCode: status,
      message,
      error: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
