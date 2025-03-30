import {
  Entity,
  Property,
  PrimaryKey,
  OneToMany,
  Collection,
  OneToOne,
  Unique,
} from '@mikro-orm/core';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Address } from './address.entity';

@Entity({ tableName: 'users' })
@Unique({ name: 'ux_idx_users_email', properties: ['email'] })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @OneToOne(() => Address, (address) => address.user)
  address!: Address;

  @OneToMany(() => Post, (post) => post.author)
  posts = new Collection<Post>(this);

  @OneToMany(() => Comment, (comment) => comment.author)
  comments = new Collection<Comment>(this);

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
