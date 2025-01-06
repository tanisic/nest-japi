import { Query } from '@nestjs/common';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: UserSchema },
  path: 'v1/users',
})
export class UserResource extends BaseResource {
  public override getAll(query: QueryParams, @Query() myQuery: any): any {
    return super.getAll(query);
  }
}
