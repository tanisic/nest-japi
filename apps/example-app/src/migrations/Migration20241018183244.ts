import { Migration } from '@mikro-orm/migrations';

export class Migration20241018183244 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "post" alter column "content" type text using ("content"::text);`);

    this.addSql(`alter table "comment" alter column "content" type text using ("content"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "post" alter column "content" type varchar(255) using ("content"::varchar(255));`);

    this.addSql(`alter table "comment" alter column "content" type varchar(255) using ("content"::varchar(255));`);
  }

}
