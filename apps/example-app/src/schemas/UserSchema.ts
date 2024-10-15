import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import { PictureSchema } from './PictureSchema';

@Schema({ jsonapiType: 'users', entity: User })
export class UserSchema extends BaseSchema<User> {
  @Attribute({ description: '- Main ID field\n- Allways visible' })
  id!: number;

  @Attribute({})
  fullName!: string;

  @Attribute({
    examples: ['test@tellus.hr', 'xyz@example.com'],
    format: 'xyz@domain.com',
  })
  email!: string;

  @Attribute({})
  password!: string;

  @Relation({
    schema: () => PictureSchema,
    many: true,
  })
  pictures: PictureSchema[];

  @Attribute({})
  bio: string;
}
