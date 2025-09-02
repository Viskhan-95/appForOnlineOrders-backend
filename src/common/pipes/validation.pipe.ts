import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

interface ValidationErrorInterface {
  constraints?: Record<string, string>;
}

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
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
      const errors = validationErrors as ValidationErrorInterface[];
      const messages = errors.map((error) => {
        const constraints = error.constraints;
        if (constraints && typeof constraints === 'object') {
          const values = Object.values(constraints);
          return values.join(', ');
        }
        return 'Validation error';
      });

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
