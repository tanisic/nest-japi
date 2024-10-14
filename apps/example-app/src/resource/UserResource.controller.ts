import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResource, Resource } from 'jsonapi-nestjs';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: UserSchema },
  disabledMethods: ['postOne', 'patchOne'],
})
export class UserResource extends BaseResource {
  public override getAll(query: any) {
    return { ...query, all: 'all' };
  }

  public override getOne(id: string | number, query: any) {
    const target = Object.getPrototypeOf(this);
    console.log({
      target,
      areSame: target === Object.getPrototypeOf(this),
    });

    const keys = Reflect.getMetadataKeys(target);
    keys.forEach((key) =>
      console.log({ key, val: Reflect.getMetadata(key, target) }),
    );
    return { id, query };
  }
}
