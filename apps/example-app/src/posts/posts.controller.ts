import { BaseResource } from 'src/resource/BaseResource';
import { CreatePostSchema, PostSchema } from 'src/posts/posts.schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Posts')
export class PostResource extends BaseResource<
  string,
  PostSchema,
  CreatePostSchema,
  CreatePostSchema
> {}
