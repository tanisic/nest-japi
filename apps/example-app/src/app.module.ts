import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from 'nest-japi';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { UserResource } from './resource/UserResource.controller';
import { PostResource } from './resource/PostResource.controller';
import { CommentResource } from './resource/CommentResource.controller';
import { AddressResource } from './resource/AddressResource.controller';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env.POSTGRES_HOST,
      password: 'postgres',
      user: 'postgres',
      port: 5444,
      dbName: 'json_api_db',
      schema: 'public',
      entities: ['./dist/**/*.entity.js'],
      entitiesTs: ['./src/**/*.entity.ts'],
      extensions: [EntityGenerator, Migrator],
      debug: ['query'],
    }),
    JsonApiModule.forRoot({
      resources: [
        UserResource,
        PostResource,
        CommentResource,
        AddressResource,
      ] as any,
      baseUrl: 'http://localhost:3000/',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
