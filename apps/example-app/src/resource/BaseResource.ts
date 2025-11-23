import { EntityManager } from '@mikro-orm/postgresql';
import { Schemas, JsonApiController, JsonApiSchema } from '@tanisic/nest-japi';

export class BaseResource<
  IdType extends string | number = string | number,
  ViewSchema extends JsonApiSchema<any> = JsonApiSchema<any>,
  CreateSchema extends JsonApiSchema<any> = ViewSchema,
  UpdateSchema extends JsonApiSchema<any> = ViewSchema,
> extends JsonApiController<
  IdType,
  EntityManager,
  Schemas<ViewSchema, CreateSchema, UpdateSchema>
> {}
