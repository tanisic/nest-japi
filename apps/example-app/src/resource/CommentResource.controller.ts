import { Query } from '@nestjs/common';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { CommentSchema } from 'src/schemas/CommentSchema';
import { PostSchema } from 'src/schemas/PostSchema';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: CommentSchema },
  path: 'v1/comments',
})
export class CommentResource extends BaseResource {}
