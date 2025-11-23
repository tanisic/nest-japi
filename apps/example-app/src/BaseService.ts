import { EntityManager } from '@mikro-orm/postgresql';
import {
  type Schemas,
  JsonApiBaseService,
  JsonApiSchema,
} from '@tanisic/nest-japi';

export class BaseService<
  IdType extends string | number = string | number,
  ViewSchema extends JsonApiSchema<any> = JsonApiSchema<any>,
  CreateSchema extends JsonApiSchema<any> = ViewSchema,
  UpdateSchema extends JsonApiSchema<any> = ViewSchema,
> extends JsonApiBaseService<
  IdType,
  EntityManager,
  Schemas<ViewSchema, CreateSchema, UpdateSchema>
> {}
