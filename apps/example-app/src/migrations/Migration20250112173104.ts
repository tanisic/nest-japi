import { Migration } from '@mikro-orm/migrations';

export class Migration20250112173104 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "addresses" ("id" serial primary key, "user_id" int not null, "city" varchar(255) not null, "street" varchar(255) not null, "street_number" varchar(255) not null, "country" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "addresses" add constraint "addresses_user_id_unique" unique ("user_id");`);

    this.addSql(`alter table "addresses" add constraint "addresses_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "addresses" cascade;`);
  }

}
