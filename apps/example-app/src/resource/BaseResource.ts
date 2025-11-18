import { EntityManager } from '@mikro-orm/postgresql';
import { BaseSchema, JsonApiBaseController } from '@tanisic/nest-japi';

export class BaseResource<
  IdType extends string | number = string | number,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> extends JsonApiBaseController<
  IdType,
  EntityManager,
  ViewSchema,
  CreateSchema,
  UpdateSchema
> {}
