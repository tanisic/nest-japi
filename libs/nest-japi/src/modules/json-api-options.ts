import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { MethodName } from "../controller/types";
import { ResourceOptions } from "../decorators/resource.decorator";
import { BaseSchema } from "../schema";
import { JsonApiModuleOptions } from "./json-api.module";

export class JsonApiOptions<
  ViewSchema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> {
  global: JsonApiModuleOptions;
  resource: ResourceOptions<
    MethodName[],
    ViewSchema,
    CreateSchema,
    UpdateSchema
  >;

  maxAllowedPagination: number;

  constructor({
    global,
    resource,
  }: {
    global: JsonApiModuleOptions;
    resource: ResourceOptions<
      MethodName[],
      ViewSchema,
      CreateSchema,
      UpdateSchema
    >;
  }) {
    this.global = global;
    this.resource = resource;

    this.maxAllowedPagination =
      this.resource.maxPaginationSize ||
      this.global.maxPaginationSize ||
      DEFAULT_PAGINATION_SIZE;
  }
}
