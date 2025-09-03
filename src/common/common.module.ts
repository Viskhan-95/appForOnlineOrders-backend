import { Module, Global } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler.service';
import { RateLimitService } from './services/rate-limit.service';
import { RedisCacheModule } from './cache/redis.module';
import { PrismaQueryOptimizerService } from './database/prisma-query-optimizer.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [RedisCacheModule, PrismaModule],
  providers: [
    ErrorHandlerService,
    RateLimitService,
    PrismaQueryOptimizerService,
  ],
  exports: [
    ErrorHandlerService,
    RateLimitService,
    RedisCacheModule,
    PrismaQueryOptimizerService,
  ],
})
export class CommonModule {}
