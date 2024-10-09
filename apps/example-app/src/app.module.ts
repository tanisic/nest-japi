import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from 'jsonapi-nestjs';

@Module({
  imports: [JsonApiModule.forRoot({ resources: [] })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
