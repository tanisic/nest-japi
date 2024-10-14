import { BaseSchema, Schema } from 'jsonapi-nestjs';
import { Picture } from 'src/entities/picture.entity';
import { User } from 'src/entities/user.entity';

@Schema({ jsonapiType: 'pictures', entity: Picture })
export class PictureSchema extends BaseSchema<User> {
  id: string;
}
