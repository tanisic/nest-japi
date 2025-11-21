import { PostResource } from './posts.controller';
import { JsonApiModule } from '@tanisic/nest-japi';
import { CreatePostSchema, PostSchema } from './posts.schema';

export const PostsModule = JsonApiModule.forFeature({
  resource: PostResource,
  schemas: {
    schema: PostSchema,
    createSchema: CreatePostSchema,
    updateSchema: CreatePostSchema,
  },
  path: 'v1/posts',
});
