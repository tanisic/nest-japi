import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from '../user/user.entity';
import { Post } from '../posts/post.entity';

@Entity()
@Index({ properties: ['author'] })
@Index({ properties: ['post'] })
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

  @ManyToOne(() => User)
  author!: User;

  @ManyToOne({ entity: () => Post, nullable: true })
  post!: Post;

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
