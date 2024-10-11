import { Entity, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  fullName!: string;

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property({ type: 'text' })
  bio = '';
}
