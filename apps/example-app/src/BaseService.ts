import { EntityManager } from '@mikro-orm/postgresql';
import { BaseSchema, JsonApiBaseService } from '@tanisic/nest-japi';

export class BaseService<
  IdType extends string | number = string | number,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> extends JsonApiBaseService<
  IdType,
  EntityManager,
  ViewSchema,
  CreateSchema,
  UpdateSchema
> {}
