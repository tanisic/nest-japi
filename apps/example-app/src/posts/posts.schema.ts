import {
  Attribute,
  BaseSchema,
  ExtractRelations,
  Relation,
  Schema,
} from '@tanisic/nest-japi';
import { Post } from 'src/posts/post.entity';
import { CommentSchema } from '../comments/comments.schema';
import { z } from 'zod';
import { UserSchema } from 'src/user/user.schema';

@Schema({ jsonapiType: 'post', entity: Post })
export class PostSchema extends BaseSchema<Post> {
  @Attribute({ validate: z.number() })
  id: number;

  @Relation({ schema: () => CommentSchema, many: true, required: false })
  comments: CommentSchema[];

  @Attribute({ validate: z.date().optional() })
  createdAt: Date;

  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;

  @Attribute({ validate: z.string() })
  title: string;

  @Attribute({ validate: z.string() })
  content: string;

  @Relation({ schema: () => UserSchema, required: true })
  author: UserSchema;
}

@Schema({ jsonapiType: 'post', entity: Post })
export class CreatePostSchema extends BaseSchema<Post> {
  @Attribute({ validate: z.number() })
  id: number;

  @Attribute({
    validate: z.string(),
  })
  title: string;

  @Attribute({ validate: z.string() })
  content: string;

  @Relation({
    schema: () => UserSchema,
    required: true,
    nullable: false,
    many: false,
  })
  author: UserSchema;
}

type t = ExtractRelations<CreatePostSchema>;
