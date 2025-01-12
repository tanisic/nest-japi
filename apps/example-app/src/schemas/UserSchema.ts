import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import { PostSchema } from './PostSchema';
import { CommentSchema } from './CommentSchema';
import { AddressSchema } from './AddressSchema';

@Schema({ jsonapiType: 'user', entity: User })
export class UserSchema extends BaseSchema<User> {
  @Attribute({
    description: '- Main ID field\n- Allways visible',
    dataKey: 'name',
  })
  nameReal: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts: PostSchema[];
  @Relation({ schema: () => CommentSchema, many: true })
  comments: CommentSchema[];
  @Relation({ schema: () => AddressSchema })
  address: AddressSchema;
  @Attribute({})
  createdAt: Date;
  @Attribute({})
  firstComment: string;
  @Attribute({})
  updatedAt: Date;
  @Attribute({ description: '- Main ID field\n- Allways visible' })
  id!: number;
}
