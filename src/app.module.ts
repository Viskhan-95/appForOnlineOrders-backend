import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { CommonModule } from './common/common.module';
import { envSchema } from './config/env.schema';
import { SecurityMiddleware } from './common/middleware/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        try {
          return envSchema.parse(config);
        } catch (error) {
          console.error('❌ Invalid environment variables:');
          console.error(error);
          process.exit(1);
        }
      },
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Будет переопределено после инициализации ConfigService
        limit: 100, // Будет переопределено после инициализации ConfigService
      },
    ]),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
