import { Resource } from 'nest-japi';
import { AddressSchema } from 'src/addresses/addresses.schema';
import { BaseResource } from 'src/resource/BaseResource';

@Resource({
  schemas: { schema: AddressSchema },
  path: 'v1/addresses',
})
export class AddressResource extends BaseResource {}
