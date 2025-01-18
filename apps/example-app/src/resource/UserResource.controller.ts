import { Query } from '@nestjs/common';
import { Request } from 'express';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: UserSchema },
  path: 'v1/users',
})
export class UserResource extends BaseResource {
  public override getAll(
    query: QueryParams,
    request: Request,
    @Query() myQuery: any,
  ): any {
    return super.getAll(query, request);
  }
}
