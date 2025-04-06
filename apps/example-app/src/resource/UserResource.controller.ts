import { QueryParams, Resource } from 'nest-japi';
import { CreateUserSchema } from 'src/schemas/CreateUserSchema';
import { UserSchema } from 'src/schemas/UserSchema';
import { BaseResource } from './BaseResource';
import { Request } from 'express';
import { DataDocument } from 'ts-japi';
import { ApiOperation } from '@nestjs/swagger';
import { PatchUserSchema } from 'src/schemas/PatchUserSchema';

@Resource({
  schemas: {
    schema: UserSchema,
    createSchema: CreateUserSchema,
    updateSchema: PatchUserSchema,
  },
  path: 'v1/users',
})
export class UserResource extends BaseResource<
  string,
  UserSchema,
  CreateUserSchema,
  PatchUserSchema
> {
  override getAll(
    query: QueryParams,
    request: Request,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    return super.getAll(query, request);
  }

  @ApiOperation({
    description: 'test123',
  })
  override patchOne(id, body) {
    return super.patchOne(id, body);
  }
}
