import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { RedocModule, RedocOptions } from 'nest-redoc';

import { transports, format } from 'winston';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { WinstonModule } from 'nest-winston';
import { apiReference } from '@scalar/nestjs-api-reference';
import { NestExpressApplication } from '@nestjs/platform-express';
extendZodWithOpenApi(z);

const winstonLogger = WinstonModule.createLogger({
  transports: [
    // let's log errors into its own file
    new transports.File({
      filename: `logs/error.log`,
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
    // logging all level
    new transports.File({
      filename: `logs/combined.log`,
      format: format.combine(format.timestamp(), format.json()),
    }),
    // we also want to see logs in our console
    new transports.Console({
      format: format.combine(
        format.cli(),
        format.splat(),
        format.timestamp(),
        format.prettyPrint(),
        format.printf((info) => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        }),
      ),
    }),
  ],
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: winstonLogger,
  });
  app.set('query parser', 'extended'); // <-- Add this line
  // app.use(
  //   bodyparser.json({
  //     type: 'application/vnd.api+json',
  //   }),
  // );
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use('/docs', apiReference({ content: document }));
  await app.listen(3000);
}
bootstrap();
