import { ApiTags } from '@nestjs/swagger';
import { AddressSchema } from 'src/addresses/addresses.schema';
import { BaseResource } from 'src/resource/BaseResource';

@ApiTags('Addresses')
export class AddressResource extends BaseResource<string, AddressSchema> {}
