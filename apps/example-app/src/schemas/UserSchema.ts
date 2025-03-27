import { Attribute, BaseSchema, Relation, Schema } from 'nest-japi';
import { User } from 'src/entities/user.entity';
import { z } from 'zod';
import { PostSchema } from './PostSchema';
import { CommentSchema } from './CommentSchema';
import { AddressSchema } from './AddressSchema';

@Schema({ jsonapiType: 'user', entity: User })
export class UserSchema extends BaseSchema<User> {
  @Attribute({ validate: z.number() })
  id: number;
  @Attribute({
    dataKey: 'name',
    validate: z.string().openapi({ description: '123' }),
  })
  nameReal: string;
  @Attribute({ validate: z.string().email() })
  email: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts: PostSchema[];
  @Relation({ schema: () => CommentSchema, many: true })
  comments: CommentSchema[];
  @Relation({ schema: () => AddressSchema })
  address: AddressSchema;
}
