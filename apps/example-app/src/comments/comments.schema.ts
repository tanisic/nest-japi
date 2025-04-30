import { Attribute, BaseSchema, Relation, Schema } from '@tanisic/nest-japi';
import { Comment } from 'src/comments/comment.entity';
import { PostSchema } from '../posts/posts.schema';
import { z } from 'zod';
import { UserSchema } from 'src/user/user.schema';

@Schema({ jsonapiType: 'comment', entity: Comment })
export class CommentSchema extends BaseSchema<Comment> {
  @Attribute({ validate: z.number() })
  id: number;
  @Attribute({ validate: z.string() })
  content: string;
  @Relation({ schema: () => UserSchema, required: true })
  author: UserSchema;
  @Relation({ schema: () => PostSchema, required: false })
  post: PostSchema;
  @Attribute({
    validate: z.date().optional(),
  })
  createdAt: Date;
  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;
}

@Schema({ jsonapiType: 'comment', entity: Comment })
export class CreateCommentSchema extends BaseSchema<Comment> {
  @Attribute({ validate: z.number() })
  id: number;
  @Attribute({ validate: z.string() })
  content: string;
  @Relation({ schema: () => UserSchema, required: true })
  author: UserSchema;
  @Relation({ schema: () => PostSchema, required: false })
  post: PostSchema;
}
