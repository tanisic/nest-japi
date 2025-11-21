import { UserService } from './user.service';
import { UserResource } from './user.controller';
import { JsonApiModule } from '@tanisic/nest-japi';
import { ParseIntPipe } from '@nestjs/common';
import { UserSchema, CreateUserSchema, PatchUserSchema } from './user.schema';

export const UserModule = JsonApiModule.forFeature({
  resource: UserResource,
  providers: [UserService],
  schemas: {
    schema: UserSchema,
    createSchema: CreateUserSchema,
    updateSchema: PatchUserSchema,
  },
  path: 'v1/users',
  idParamPipe: ParseIntPipe,
});
