import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { UserSchema } from './UserSchema';
import { CommentSchema } from './CommentSchema';

@Schema({ jsonapiType: 'post', entity: Post })
export class PostSchema extends BaseSchema<Post> {
  @Attribute({})
  id: number;
  @Relation({ schema: () => CommentSchema, many: true })
  comments: CommentSchema[];
  @Attribute({})
  createdAt: Date;
  @Attribute({})
  updatedAt: Date;
  @Attribute({})
  title: string;
  @Attribute({})
  content: string;
  @Relation({ schema: () => UserSchema })
  author: User;
}
