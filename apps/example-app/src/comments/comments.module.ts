import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { CommentResource } from './comments.controller';

export const CommentsModule = JsonApiModule.forFeature({
  resource: CommentResource,
  providers: [CommentsService],
});
