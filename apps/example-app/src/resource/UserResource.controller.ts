import { BaseResource, Resource } from 'jsonapi-nestjs';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: UserSchema },
  disabledMethods: ['patchOne'],
})
export class UserResource extends BaseResource {
  // public override getAll(query: QueryParams) {
  //   return this.serializerService.serialize(
  //     {
  //       id: 12,
  //       bio: 'test bio',
  //       email: 'test@test.hr',
  //       fullName: 'first name last name',
  //       pictures: [
  //         {
  //           id: 12,
  //           url: 'test',
  //           location: {
  //             id: 12,
  //             address: 'test street',
  //             floor: 2,
  //             employees: 12,
  //           },
  //         },
  //       ],
  //     },
  //     UserSchema,
  //     {
  //       include: query.include || [],
  //       sparseFields: query.fields,
  //       page: query.page,
  //     },
  //   );
  // }
}
