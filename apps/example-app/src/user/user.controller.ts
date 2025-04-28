import { PatchBody, QueryParams, Resource } from 'nest-japi';
import { Request } from 'express';
import { DataDocument } from 'ts-japi';
import { ApiOperation } from '@nestjs/swagger';
import { BaseResource } from 'src/resource/BaseResource';
import { UserSchema, CreateUserSchema, PatchUserSchema } from './user.schema';
import { UserService } from './user.service';

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
  constructor(private userService: UserService) {
    super();
  }
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
  override patchOne(id: string, body: PatchBody<PatchUserSchema>) {
    return super.patchOne(id, body);
  }
}
