import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  );

  // Limit body size to 3MB to handle image_base64 up to ~2MB
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(require('express').json({ limit: '3mb' }));

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GiaSuAI API')
    .setDescription(
      'API giải bài tập tự động bằng AI (text/ảnh) cho ứng dụng GiaSuAI.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Firebase ID token (gửi qua header Authorization: Bearer <token>)',
      },
      'firebase-auth',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
