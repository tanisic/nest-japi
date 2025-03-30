import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from 'nest-redoc';
import * as bodyparser from 'body-parser';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    bodyparser.json({
      type: 'application/vnd.api+json',
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const redocOptions: Partial<RedocOptions> = {
    title: 'Hello Nest',
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
  };
  const document = SwaggerModule.createDocument(app, config);
  RedocModule.setup('api', app, document, redocOptions);
  await app.listen(3000);
}
bootstrap();
