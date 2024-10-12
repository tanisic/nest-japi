import { Migration } from '@mikro-orm/migrations';

export class Migration20241011112302 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "pictures" ("id" serial primary key, "url" varchar(255) not null, "owner_id" int not null);`);

    this.addSql(`alter table "pictures" add constraint "pictures_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pictures" cascade;`);
  }

}
