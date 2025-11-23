import {
  Attribute,
  Schema,
  Relation,
  JsonApiSchema,
  HasMany,
  HasOne,
} from '@tanisic/nest-japi';
import { User } from 'src/user/user.entity';
import { CommentSchema } from 'src/comments/comments.schema';
import { PostSchema } from 'src/posts/posts.schema';
import { z } from 'zod';
import { AddressSchema } from 'src/addresses/addresses.schema';

@Schema({ jsonapiType: 'user', entity: User })
export class UserSchema extends JsonApiSchema<User> {
  @Attribute({ validate: z.number() })
  id: number;
  @Attribute({
    dataKey: 'name',
    validate: z.string(),
    openapi: { description: 'Real name of user' },
  })
  nameReal: string;
  @Attribute({ validate: z.string().email() })
  email: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts!: HasMany<PostSchema>;
  @Relation({ schema: () => CommentSchema, many: true })
  comments: HasMany<CommentSchema>;
  @Relation({
    schema: () => AddressSchema,
    openapi: { description: 'Address of user' },
  })
  address: HasOne<AddressSchema>;
}

@Schema({ jsonapiType: 'user', entity: User })
export class PatchUserSchema extends JsonApiSchema<User> {
  @Attribute({
    validate: z.number(),
  })
  id!: number;
  @Attribute({
    validate: z.string().optional(),
  })
  name: string;
  @Attribute({ validate: z.string().email().optional() })
  email: string;
  @Relation({ schema: () => AddressSchema })
  address: HasOne<AddressSchema>;
}

@Schema({ jsonapiType: 'user', entity: User })
export class CreateUserSchema extends JsonApiSchema<User> {
  @Attribute({
    validate: z.number(),
  })
  id!: number;
  @Attribute({
    dataKey: 'name',
    validate: z.string(),
  })
  nameReal: string;
  @Attribute({ validate: z.string().email() })
  email: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts: HasMany<PostSchema>;
  @Relation({ schema: () => CommentSchema, many: true })
  comments: HasMany<CommentSchema>;
  @Relation({ schema: () => AddressSchema })
  address: HasOne<AddressSchema>;
}
