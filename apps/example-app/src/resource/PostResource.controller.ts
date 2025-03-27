import { Resource } from 'nest-japi';
import { PostSchema } from 'src/schemas/PostSchema';
import { BaseResource } from './BaseResource';

@Resource({
  schemas: { schema: PostSchema },
  path: 'v1/posts',
})
export class PostResource extends BaseResource<string, PostSchema> {}
