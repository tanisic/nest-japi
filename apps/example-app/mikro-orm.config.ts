import { defineConfig } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.POSTGRES_HOST,
  password: 'postgres',
  user: 'postgres',
  port: 5444,
  dbName: 'json_api_db',
  schema: 'public',
  entities: ['./dist/**/*.entity.js'],
  seeder: {
    path: 'dist/**/seeders/**',
    emit: 'ts',
  },
  extensions: [EntityGenerator, Migrator, SeedManager],
});
