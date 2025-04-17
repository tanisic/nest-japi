import { defineConfig } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import * as dotenv from 'dotenv';

dotenv.config();

console.log(process.env);

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.POSTGRES_HOST,
  password: process.env.POSTGRES_PASSWORD,
  user: process.env.POSTGRES_USER,
  port: Number(process.env.POSTGRES_PORT),
  dbName: process.env.POSTGRES_DB_NAME,
  schema: 'public',
  entities: ['./dist/**/*.entity.js'],
  seeder: {
    path: 'dist/**/seeders/**',
    defaultSeeder: 'MainSeeder',
    emit: 'ts',
  },
  extensions: [EntityGenerator, Migrator, SeedManager],
});
