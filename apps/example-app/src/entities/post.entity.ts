import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity()
export class Post {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'varchar', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @ManyToOne(() => User)
  author!: User;

  @OneToMany({
    entity: () => Comment,
    mappedBy: (comment) => comment.post,
    nullable: true,
    strategy: 'select-in',
  })
  comments = new Collection<Comment>(this);

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
