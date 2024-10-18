import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { Comment } from 'src/entities/comment.entity';
import { UserSchema } from './UserSchema';
import { PostSchema } from './PostSchema';

@Schema({ jsonapiType: 'comment', entity: Comment })
export class CommentSchema extends BaseSchema<Comment> {
  @Attribute({})
  id: number;
  @Attribute({})
  content: string;
  @Relation({ schema: () => UserSchema })
  author: UserSchema;
  @Relation({ schema: () => PostSchema })
  post: PostSchema;
  @Attribute({})
  createdAt: Date;
  @Attribute({})
  updatedAt: Date;
}
