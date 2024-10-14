import { Attribute, BaseSchema, Schema } from 'jsonapi-nestjs';
import { Picture } from 'src/entities/picture.entity';

@Schema({ jsonapiType: 'pictures', entity: Picture })
export class PictureSchema extends BaseSchema<Picture> {
  @Attribute<Picture>({
    required: true,
    description: 'Id field',
  })
  id: string;
}
