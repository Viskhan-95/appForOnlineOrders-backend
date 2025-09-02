import { Module, Global } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler.service';
import { RateLimitService } from './services/rate-limit.service';

@Global()
@Module({
  providers: [ErrorHandlerService, RateLimitService],
  exports: [ErrorHandlerService, RateLimitService],
})
export class CommonModule {}
