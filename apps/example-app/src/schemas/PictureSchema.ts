import { Attribute, BaseSchema, Relation, Schema } from 'jsonapi-nestjs';
import { Picture } from 'src/entities/picture.entity';
import { UserSchema } from './UserSchema';
import { WorkplaceSchema } from './WorkplaceSchema';

@Schema({ jsonapiType: 'pictures', entity: Picture })
export class PictureSchema extends BaseSchema<Picture> {
  @Attribute<Picture>({
    required: true,
    description: 'Id field',
  })
  id: string;

  @Attribute<Picture>({
    required: true,
  })
  url!: string;

  @Relation({ schema: () => UserSchema })
  owner!: UserSchema;

  @Relation({ schema: () => WorkplaceSchema })
  location!: WorkplaceSchema;
}
