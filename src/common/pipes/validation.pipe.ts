import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly errorHandler: ErrorHandlerService) {}

  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype as never, value as never) as object;
    const validationErrors = await validate(object as never);

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const messages =
        this.errorHandler.handleValidationError(validationErrors);

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: unknown): boolean {
    const types: unknown[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
