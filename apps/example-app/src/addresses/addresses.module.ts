import { AddressesService } from './addresses.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { AddressResource } from './addresses.controller';

export const AddressesModule = JsonApiModule.forFeature({
  resource: AddressResource,
  providers: [AddressesService],
});
