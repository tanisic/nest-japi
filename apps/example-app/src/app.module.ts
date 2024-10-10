import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from 'jsonapi-nestjs';
import { ConcreteResource } from './resource/ConcreteResource';

@Module({
  imports: [JsonApiModule.forRoot({ resources: [ConcreteResource] })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
