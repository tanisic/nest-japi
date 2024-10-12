import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';
import { Picture } from './picture.entity';

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

  @OneToMany(() => Picture, 'owner')
  pictures = new Collection<Picture>(this);

  @Property({ type: 'text' })
  bio = '';
}
