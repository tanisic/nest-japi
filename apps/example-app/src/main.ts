import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from 'nest-redoc';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const redocOptions: Partial<RedocOptions> = {
    title: 'Hello Nest',
    logo: {
      href: 'https://redocly.github.io/redoc/petstore-logo.png',
      url: 'https://redocly.github.io/redoc/petstore-logo.png',
      backgroundColor: '#F0F0F0',
      altText: 'PetStore logo',
    },
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
  };
  const document = SwaggerModule.createDocument(app, config);
  RedocModule.setup('api', app, document, redocOptions);
  await app.listen(3000);
}
bootstrap();
