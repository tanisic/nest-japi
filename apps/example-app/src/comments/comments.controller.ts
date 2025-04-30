import { Resource } from '@tanisic/nest-japi';
import { BaseResource } from 'src/resource/BaseResource';
import {
  CommentSchema,
  CreateCommentSchema,
} from 'src/comments/comments.schema';

@Resource({
  schemas: { schema: CommentSchema, createSchema: CreateCommentSchema },
  path: 'v1/comments',
})
export class CommentResource extends BaseResource<
  string,
  CommentSchema,
  CreateCommentSchema
> {}
