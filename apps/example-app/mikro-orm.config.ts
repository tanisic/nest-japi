import { defineConfig } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.POSTGRES_HOST,
  password: 'teambuilding12322',
  user: 'teambuilding',
  port: process.env.POSTGRES_PORT as unknown as number,
  dbName: 'example-jsonapi',
  schema: 'public',
  entities: ['./dist/**/*.entity.js'],
  seeder: {
    path: 'dist/**/seeders/**',
    emit: 'ts',
  },
  extensions: [EntityGenerator, Migrator, SeedManager],
});
