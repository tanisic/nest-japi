import { AddressesService } from './addresses.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { AddressResource } from './addresses.controller';
import { z } from 'zod';
import { AddressSchema } from './addresses.schema';

export const AddressesModule = JsonApiModule.forFeature({
  resource: AddressResource,
  providers: [AddressesService],
  schemas: { schema: AddressSchema },
  disabledMethods: ['getOne', 'patchOne'],
  metaSchemas: {
    getAll: { document: z.object({ test: z.string() }).strict() },
  },
  path: 'v1/addresses',
});
