import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { UserModule } from './user/user.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { AddressesModule } from './addresses/addresses.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          driver: PostgreSqlDriver,
          host: config.get('POSTGRES_HOST'),
          password: config.get('POSTGRES_PASSWORD'),
          user: config.get('POSTGRES_USER'),
          port: Number(config.get('POSTGRES_PORT')),
          dbName: config.get('POSTGRES_DB_NAME'),
          schema: 'public',
          entities: ['./dist/**/*.entity.js'],
          entitiesTs: ['./src/**/*.entity.ts'],
          extensions: [EntityGenerator, Migrator],
          debug: ['query'],
        };
      },
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
