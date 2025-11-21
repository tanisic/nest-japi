import { BaseResource } from 'src/resource/BaseResource';
import {
  CommentSchema,
  CreateCommentSchema,
} from 'src/comments/comments.schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Comments')
export class CommentResource extends BaseResource<
  string,
  CommentSchema,
  CreateCommentSchema
> {}
