import { Query } from '@nestjs/common';
import { BaseResource, QueryParams, Resource } from 'jsonapi-nestjs';
import { AddressSchema } from 'src/schemas/AddressSchema';
import { CommentSchema } from 'src/schemas/CommentSchema';
import { PostSchema } from 'src/schemas/PostSchema';
import { UserSchema } from 'src/schemas/UserSchema';

@Resource({
  schemas: { schema: AddressSchema },
  path: 'v1/addresses',
})
export class AddressResource extends BaseResource {}
