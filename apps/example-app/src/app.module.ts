import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from 'jsonapi-nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { UserResource } from './resource/UserResource';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env.POSTGRES_HOST,
      password: 'teambuilding12322',
      user: 'teambuilding',
      port: process.env.POSTGRES_PORT as unknown as number,
      dbName: 'jsonapi',
      schema: 'public',
      entities: ['./dist/**/*.entity.js'],
      entitiesTs: ['./src/**/*.entity.ts'],
      extensions: [EntityGenerator, Migrator],
    }),
    JsonApiModule.forRoot({ resources: [UserResource] }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
