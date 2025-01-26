import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import { PostSchema } from './PostSchema';
import { CommentSchema } from './CommentSchema';
import { AddressSchema } from './AddressSchema';
import { z } from 'zod';

@Schema({ jsonapiType: 'user', entity: User })
export class CreateUserSchema extends BaseSchema<User> {
  @Attribute({
    description: '- Main ID field\n- Allways visible',
    dataKey: 'name',
    validate: z.string(),
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
  @Attribute({
    description: '- Main ID field\n- Allways visible',
    validate: z.number(),
  })
  id!: number;
}
