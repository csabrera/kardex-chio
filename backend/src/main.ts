import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3010', 'https://frontend-production-d152.up.railway.app'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  console.log(`Starting server on ${host}:${port}...`);
  await app.listen(port, host);
  console.log(`✓ KardexChio Backend listening on ${host}:${port}`);
}
bootstrap();
