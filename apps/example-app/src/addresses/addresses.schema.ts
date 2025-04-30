import { Attribute, BaseSchema, Relation, Schema } from '@tanisic/nest-japi';
import { Address } from 'src/addresses/address.entity';
import { UserSchema } from 'src/user/user.schema';
import { z } from 'zod';

@Schema({ jsonapiType: 'address', entity: Address })
export class AddressSchema extends BaseSchema<Address> {
  @Attribute({ validate: z.number() })
  id!: number;
  @Attribute({ validate: z.string().optional() })
  city?: string;
  @Attribute({ validate: z.string().optional() })
  street?: string;
  @Attribute({ validate: z.string().optional() })
  streetNumber?: string;
  @Attribute({ validate: z.string().optional() })
  country?: string;
  @Relation({ schema: () => UserSchema })
  user: UserSchema;
  @Attribute({ validate: z.date().optional() })
  createdAt: Date;
  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;
}
