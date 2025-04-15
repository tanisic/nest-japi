import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostResource } from './posts.controller';
import { JsonApiModule } from 'nest-japi';

@Module({
  imports: [JsonApiModule.forFeature({ resource: PostResource })],
  providers: [PostsService],
})
export class PostsModule {}
