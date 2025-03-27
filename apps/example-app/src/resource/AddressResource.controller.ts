import { Resource } from 'nest-japi';
import { AddressSchema } from 'src/schemas/AddressSchema';
import { BaseResource } from './BaseResource';

@Resource({
  schemas: { schema: AddressSchema },
  path: 'v1/addresses',
})
export class AddressResource extends BaseResource {}
