import { EntityManager } from '@mikro-orm/postgresql';
import { BaseSchema, JsonBaseController } from 'nest-japi';

export class BaseResource<
  IdType = string | number,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  PostSchema extends BaseSchema<any> = ViewSchema,
> extends JsonBaseController<
  IdType,
  EntityManager,
  ViewSchema,
  CreateSchema,
  PostSchema
> {}
