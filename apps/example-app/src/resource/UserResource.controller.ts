import { Query } from '@nestjs/common';
import { Request } from 'express';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { CreateUserSchema } from 'src/schemas/CreateUserSchema';
import { UserSchema } from 'src/schemas/UserSchema';
import { DataDocument } from 'ts-japi';

@Resource({
  schemas: { schema: UserSchema, createSchema: CreateUserSchema },
  path: 'v1/users',
})
export class UserResource extends BaseResource {
  public getAll(
    query: QueryParams,
    request: Request,
    @Query() myQuery: any,
  ): any {
    return super.getAll(query, request);
  }

  postOne(
    body: unknown,
    ...args: any[]
  ): Promise<Partial<DataDocument<unknown>>> {
    return super.postOne(body);
  }
}
