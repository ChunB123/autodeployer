import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { config } from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme } from 'swagger-themes';

const logger = new Logger(`App`);

async function bootstrap() {
  config();
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      validationError: { target: false },
      errorHttpStatusCode: 400,
    }),
  );

  // Create a Swagger document
  const options = new DocumentBuilder()
    .setTitle(process.env.SERVICE_NAME)
    .setDescription('API for awsops microservice of Autodeployer project')
    .setVersion('1.0')
    .build();

  const theme = new SwaggerTheme('v3');
  const themeOptions = {
    customCss: theme.getBuffer('dark'),
  };
  const document = SwaggerModule.createDocument(app, options);

  // Enable Swagger UI at /api
  SwaggerModule.setup('api', app, document, themeOptions);

  await app.listen(process.env.SERVICE_PORT);
  logger.debug(`Application is running on port: ${process.env.SERVICE_PORT}`);
}
bootstrap();
