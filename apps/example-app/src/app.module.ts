import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from 'nest-japi';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { UserModule } from './user/user.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { AddressesModule } from './addresses/addresses.module';

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
      maxPaginationSize: 5000,
      baseUrl: 'http://localhost:3000/',
    }),
    UserModule,
    PostsModule,
    CommentsModule,
    AddressesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
