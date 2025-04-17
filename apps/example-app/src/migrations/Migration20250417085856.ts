import { Migration } from '@mikro-orm/migrations';

export class Migration20250417085856 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create index "post_author_id_index" on "post" ("author_id");`);

    this.addSql(`create index "comment_post_id_index" on "comment" ("post_id");`);
    this.addSql(`create index "comment_author_id_index" on "comment" ("author_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "post_author_id_index";`);

    this.addSql(`drop index "comment_post_id_index";`);
    this.addSql(`drop index "comment_author_id_index";`);
  }

}
