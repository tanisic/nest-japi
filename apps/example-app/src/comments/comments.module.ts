import { CommentsService } from './comments.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { CommentResource } from './comments.controller';
import { CommentSchema, CreateCommentSchema } from './comments.schema';

export const CommentsModule = JsonApiModule.forFeature({
  resource: CommentResource,
  providers: [CommentsService],
  schemas: { schema: CommentSchema, createSchema: CreateCommentSchema },
  path: 'v1/comments',
});
