import { Resource } from '@tanisic/nest-japi';
import { AddressSchema } from 'src/addresses/addresses.schema';
import { BaseResource } from 'src/resource/BaseResource';
import { z } from 'zod';

@Resource({
  schemas: { schema: AddressSchema },
  disabledMethods: ['getOne', 'patchOne'],
  metaSchemas: {
    getAll: { document: z.object({ test: z.string() }).strict() },
  },
  path: 'v1/addresses',
})
export class AddressResource extends BaseResource<string, AddressSchema> {}
