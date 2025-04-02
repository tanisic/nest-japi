import { Migration } from '@mikro-orm/migrations';

export class Migration20250401171025 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "comment" drop constraint "comment_post_id_foreign";`);

    this.addSql(`alter table "comment" alter column "post_id" type int using ("post_id"::int);`);
    this.addSql(`alter table "comment" alter column "post_id" drop not null;`);
    this.addSql(`alter table "comment" add constraint "comment_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "comment" drop constraint "comment_post_id_foreign";`);

    this.addSql(`alter table "comment" alter column "post_id" type int using ("post_id"::int);`);
    this.addSql(`alter table "comment" alter column "post_id" set not null;`);
    this.addSql(`alter table "comment" add constraint "comment_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade;`);
  }

}
