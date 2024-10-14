import { ApiProperty } from '@nestjs/swagger';
import { BaseSchema, Schema } from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';

@Schema({ jsonapiType: 'users', entity: User })
export class UserSchema extends BaseSchema<User> {
  @ApiProperty()
  test1: string;
}
