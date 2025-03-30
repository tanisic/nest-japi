import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from 'nest-redoc';

import { transports, format } from 'winston';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { WinstonModule } from 'nest-winston';
extendZodWithOpenApi(z);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
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
    }),
  });
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
