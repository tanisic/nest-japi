import { Resource } from 'nest-japi';
import { BaseResource } from 'src/resource/BaseResource';
import { CreatePostSchema, PostSchema } from 'src/posts/posts.schema';

@Resource({
  schemas: {
    schema: PostSchema,
    createSchema: CreatePostSchema,
    updateSchema: CreatePostSchema,
  },
  path: 'v1/posts',
})
export class PostResource extends BaseResource<
  string,
  PostSchema,
  CreatePostSchema,
  CreatePostSchema
> {}
