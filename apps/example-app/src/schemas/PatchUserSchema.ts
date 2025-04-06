import { Attribute, BaseSchema, Relation, Schema } from 'nest-japi';
import { User } from 'src/entities/user.entity';
import { AddressSchema } from './AddressSchema';
import { z } from 'zod';

@Schema({ jsonapiType: 'user', entity: User })
export class PatchUserSchema extends BaseSchema<User> {
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
  address: AddressSchema;
}
