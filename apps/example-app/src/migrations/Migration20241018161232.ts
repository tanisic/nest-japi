import { Migration } from '@mikro-orm/migrations';

export class Migration20241018161232 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial primary key, "name" varchar(255) not null, "email" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`create table "post" ("id" serial primary key, "title" varchar(255) not null, "content" varchar(255) not null, "author_id" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`create table "comment" ("id" serial primary key, "content" varchar(255) not null, "author_id" int not null, "post_id" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`alter table "post" add constraint "post_author_id_foreign" foreign key ("author_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "comment" add constraint "comment_author_id_foreign" foreign key ("author_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "comment" add constraint "comment_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "post" drop constraint "post_author_id_foreign";`);

    this.addSql(`alter table "comment" drop constraint "comment_author_id_foreign";`);

    this.addSql(`alter table "comment" drop constraint "comment_post_id_foreign";`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "post" cascade;`);

    this.addSql(`drop table if exists "comment" cascade;`);
  }

}
