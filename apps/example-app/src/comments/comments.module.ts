import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { CommentResource } from './comments.controller';

@Module({
  imports: [JsonApiModule.forFeature({ resource: CommentResource })],
  providers: [CommentsService],
})
export class CommentsModule {}
