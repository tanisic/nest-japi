import { EntityMetadata } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Get, Inject, Query } from '@nestjs/common';
import {
  BaseResource,
  CURRENT_ENTITY_METADATA,
  Resource,
  SortPipe,
} from 'jsonapi-nestjs';
import { User } from 'src/entities/user.entity';
import * as z from 'zod';

const schema = z.object({
  test: z.string().optional(),
});

type UserSchema = typeof schema;

@Resource({ dbEntity: User, validationSchema: schema })
export class UserResource extends BaseResource<User, UserSchema> {
  @Inject(CURRENT_ENTITY_METADATA)
  private metadata: EntityMetadata<User>;

  constructor(private em: EntityManager) {
    super();
  }

  @Get()
  getOne(@Query('sort', SortPipe) sort: any) {
    console.dir(sort);
    return '';
  }
}
