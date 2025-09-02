import { Injectable } from '@nestjs/common';
import { ValidationService } from './validation.service';
import type {
  CreateUserData,
  UserCredentials,
} from '../interfaces/user.interfaces';

@Injectable()
export class BaseValidationService {
  constructor(private readonly validationService: ValidationService) {}

  validateUserRegistration(input: CreateUserData): void {
    this.validationService.validateEmail(input.email);
    this.validationService.validatePassword(input.password);
    this.validationService.validateName(input.name);
    this.validationService.validatePhone(input.phone);
  }

  validateUserLogin(input: UserCredentials): void {
    this.validationService.validateEmail(input.email);
    this.validationService.validatePassword(input.password);
  }

  sanitizeUserInput(input: CreateUserData) {
    return {
      ...input,
      email: this.validationService.sanitizeInput(input.email),
      name: this.validationService.sanitizeInput(input.name),
      phone: this.validationService.sanitizeInput(input.phone),
      address: input.address
        ? this.validationService.sanitizeInput(input.address)
        : undefined,
    };
  }

  validateEmail(email: string): void {
    this.validationService.validateEmail(email);
  }

  validatePassword(password: string): void {
    this.validationService.validatePassword(password);
  }
}
