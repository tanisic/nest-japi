import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import { PostSchema } from './PostSchema';
import { CommentSchema } from './CommentSchema';

@Schema({ jsonapiType: 'user', entity: User })
export class UserSchema extends BaseSchema<User> {
  @Attribute({ description: '- Main ID field\n- Allways visible' })
  name: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts: PostSchema[];
  @Relation({ schema: () => CommentSchema, many: true })
  comments: CommentSchema[];
  @Attribute({})
  createdAt: Date;
  @Attribute({})
  updatedAt: Date;
  @Attribute({ description: '- Main ID field\n- Allways visible' })
  id!: number;
}
