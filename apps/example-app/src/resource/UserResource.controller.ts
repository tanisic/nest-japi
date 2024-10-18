import { ApiResponse } from '@nestjs/swagger';
import { BaseResource, Resource, SerializerService } from 'jsonapi-nestjs';
import { UserSchema } from 'src/schemas/UserSchema';
import { JapiError, Linker, Paginator, Relator, Serializer } from 'ts-japi';

@Resource({
  schemas: { schema: UserSchema },
  disabledMethods: ['postOne', 'patchOne'],
})
export class UserResource extends BaseResource {
  constructor(private serializerService: SerializerService) {
    super();
  }
  public override getAll(query: any) {
    return this.serializerService.serialize(
      {
        id: 12,
        bio: 'test bio',
        email: 'test@test.hr',
        fullName: 'first name last name',
        pictures: [
          {
            id: 12,
            url: 'test',
            location: {
              id: 12,
              address: 'test street',
              floor: 2,
              employees: 12,
            },
          },
        ],
      },
      UserSchema,
      {
        include: query.include || [],
        sparseFields: query.fields,
        page: query.page,
      },
    );
  }

  @ApiResponse({ type: () => UserSchema })
  public override getOne(id: string | number, query: any): any {
    const rootUrl = 'http://example.com';
    const data = {
      id: 1,
      name: 'test',
      lastName: 'test',
      street: 'test street',
      workplace: { id: 12, name: 'workplace 12', label: 'My workplace' },
    };
    const usersPaginator = new Paginator((data: any) => {
      return {
        first: `${rootUrl}/users/0`,
        last: `${rootUrl}/users/999`,
        next: `${rootUrl}/users/${data.id}`,
        prev: `${rootUrl}/users/${data.id - 1}`,
      };
    });
    const serial = new Serializer('users', {
      include: ['workplaces'],
      projection: { workplace: 0 },
      linkers: { paginator: usersPaginator },
    });
    const workplaceSerial = new Serializer('workplaces', {
      projection: { name: 1, label: 1 },
    });

    const workplaceUsersLinker = new Linker((user, article) => {
      return `${rootUrl}/users/${user.id}/relationships/workplace`;
    });

    const workplaceRelation = new Relator(
      (data: any) => data.workplace,
      workplaceSerial,
      { linkers: { relationship: workplaceUsersLinker } },
    );
    serial.setRelators([workplaceRelation]);
    return serial.serialize(data as any);
  }
}
