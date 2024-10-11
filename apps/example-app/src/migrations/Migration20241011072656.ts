import { Migration } from '@mikro-orm/migrations';

export class Migration20241011072656 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial primary key, "full_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "bio" text not null default '');`);
  }

}
