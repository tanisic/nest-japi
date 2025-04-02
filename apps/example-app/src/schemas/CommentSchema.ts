import { Attribute, BaseSchema, Relation, Schema } from 'nest-japi';
import { Comment } from 'src/entities/comment.entity';
import { UserSchema } from './UserSchema';
import { PostSchema } from './PostSchema';
import { z } from 'zod';

@Schema({ jsonapiType: 'comment', entity: Comment })
export class CommentSchema extends BaseSchema<Comment> {
  @Attribute({ validate: z.number() })
  id: number;
  @Attribute({ validate: z.string() })
  content: string;
  @Relation({ schema: () => UserSchema, required: true })
  author: UserSchema;
  @Relation({ schema: () => PostSchema })
  post: PostSchema;
  @Attribute({ validate: z.date().optional() })
  createdAt: Date;
  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;
}
