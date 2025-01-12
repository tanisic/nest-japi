import { Migration } from '@mikro-orm/migrations';

export class Migration20250112173448 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "addresses" drop constraint "addresses_user_id_foreign";`);

    this.addSql(`alter table "addresses" alter column "user_id" type int using ("user_id"::int);`);
    this.addSql(`alter table "addresses" alter column "user_id" drop not null;`);
    this.addSql(`alter table "addresses" add constraint "addresses_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "addresses" drop constraint "addresses_user_id_foreign";`);

    this.addSql(`alter table "addresses" alter column "user_id" type int using ("user_id"::int);`);
    this.addSql(`alter table "addresses" alter column "user_id" set not null;`);
    this.addSql(`alter table "addresses" add constraint "addresses_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
  }

}
