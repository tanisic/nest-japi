import { PostsService } from './posts.service';
import { PostResource } from './posts.controller';
import { JsonApiModule } from '@tanisic/nest-japi';

export const PostsModule = JsonApiModule.forFeature({
  resource: PostResource,
  providers: [PostsService],
});
