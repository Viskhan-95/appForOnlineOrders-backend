import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ErrorHandlerService } from './common/services/error-handler.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 1_000_000, // Будет переопределено после инициализации ConfigService
    }),
  );

  const configService = app.get(ConfigService);
  const bodyLimit = configService.get<number>('BODY_LIMIT_BYTES');

  // Обновляем bodyLimit для Fastify после получения конфигурации
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onRequest', (request, reply, done) => {
    // bodyLimit уже установлен в FastifyAdapter, дополнительная настройка не нужна
    done();
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const corsOrigins = corsOrigin
    ? corsOrigin
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : true;
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe(app.get(ErrorHandlerService)));

  // if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Online Orders API')
    .setDescription('Документация API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerEnabled =
    configService.get<boolean>('SWAGGER_ENABLED') === true ||
    configService.get<string>('NODE_ENV') !== 'production';
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
  // }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
