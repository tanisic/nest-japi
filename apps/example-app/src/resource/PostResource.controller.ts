import { Query } from '@nestjs/common';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { PostSchema } from 'src/schemas/PostSchema';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: PostSchema },
  path: 'v1/posts',
})
export class PostResource extends BaseResource {}
