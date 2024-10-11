import { defineConfig } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.POSTGRES_HOST,
  password: 'teambuilding12322',
  user: 'teambuilding',
  port: process.env.POSTGRES_PORT as unknown as number,
  dbName: 'jsonapi',
  schema: 'public',
  entities: ['./dist/**/*.entity.js'],
  extensions: [EntityGenerator, Migrator],
});
