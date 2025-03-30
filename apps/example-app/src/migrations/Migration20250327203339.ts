import { Migration } from '@mikro-orm/migrations';

export class Migration20250327203339 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "users" add constraint "ux_idx_users_email" unique ("email");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "ux_idx_users_email";`);
  }
}
