import { Resource } from 'nest-japi';
import { CreatePostSchema, PostSchema } from 'src/schemas/PostSchema';
import { BaseResource } from './BaseResource';

@Resource({
  schemas: { schema: PostSchema, createSchema: CreatePostSchema },
  path: 'v1/posts',
})
export class PostResource extends BaseResource<
  string,
  PostSchema,
  CreatePostSchema
> {}
