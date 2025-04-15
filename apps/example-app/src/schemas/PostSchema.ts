import {
  Attribute,
  BaseSchema,
  ExtractRelations,
  Relation,
  Schema,
} from 'nest-japi';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { UserSchema } from './UserSchema';
import { CommentSchema } from './CommentSchema';
import { z } from 'zod';

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
  author: User;
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
  author: User;
}

type t = ExtractRelations<CreatePostSchema>;
