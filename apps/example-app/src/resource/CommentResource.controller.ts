import { Resource } from 'nest-japi';
import { CommentSchema } from 'src/schemas/CommentSchema';
import { BaseResource } from './BaseResource';

@Resource({
  schemas: { schema: CommentSchema },
  path: 'v1/comments',
})
export class CommentResource extends BaseResource {}
