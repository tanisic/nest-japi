import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import { Address } from 'src/entities/address.entity';
import { UserSchema } from './UserSchema';

@Schema({ jsonapiType: 'address', entity: Address })
export class AddressSchema extends BaseSchema<User> {
  @Attribute({ description: '- Main ID field\n- Allways visible' })
  id!: number;
  @Attribute({})
  city?: string;
  @Attribute({})
  street?: string;
  @Attribute({})
  streetNumber?: string;
  @Attribute({})
  country?: string;
  @Relation({ schema: () => UserSchema })
  user: UserSchema;
  @Attribute({})
  createdAt: Date;
  @Attribute({})
  updatedAt: Date;
}
