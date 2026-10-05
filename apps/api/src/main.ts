import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cors from 'cors';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('ImpactLensAPI');
  const app = await NestFactory.create(AppModule);

  // Security middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3201',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Signature-SHA256'],
    })
  );

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Global Validation & Exception filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Compliance Impact Analyzer (ImpactLens) API')
    .setDescription(
      'Enterprise Compliance Impact Analysis system for regulatory change evaluation, applicability reasoning, evidence citations, and human review workflows.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and session tokens')
    .addTag('Organizations', 'Client enterprise profiles and versioning')
    .addTag('Regulatory Changes', 'Regulatory change ingestion and diff tracking')
    .addTag('Impact Analyses', 'Compliance impact assessment and priority scoring')
    .addTag('Actions', 'Action planning and workflow status')
    .addTag('Applicability Rules', 'Configurable rule engine definitions')
    .addTag('Integrations', 'RegTracker webhooks and Legal RAG connectors')
    .addTag('Health', 'Liveness and readiness health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 4201;
  await app.listen(port);
  logger.log(`ImpactLens API server listening on http://localhost:${port}/api`);
  logger.log(`Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
