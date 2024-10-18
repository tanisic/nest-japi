import { Entity, Property, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity()
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

  @ManyToOne(() => User)
  author!: User;

  @ManyToOne(() => Post)
  post!: Post;

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
