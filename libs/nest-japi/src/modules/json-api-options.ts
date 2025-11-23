import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { MethodName } from "../controller/types";
import { ResourceOptions } from "../decorators/resource.decorator";
import { Schemas } from "../schema";
import { JsonApiModuleOptions } from "./json-api.module";

export class JsonApiOptions<
  TSchemas extends Schemas<any, any, any> = Schemas<any, any, any>,
> {
  global: JsonApiModuleOptions;
  resource: ResourceOptions<MethodName[], TSchemas>;

  maxAllowedPagination: number;

  constructor({
    global,
    resource,
  }: {
    global: JsonApiModuleOptions;
    resource: ResourceOptions<any, TSchemas>;
  }) {
    this.global = global;
    this.resource = resource;

    this.maxAllowedPagination =
      this.resource.maxPaginationSize ||
      this.global.maxPaginationSize ||
      DEFAULT_PAGINATION_SIZE;
  }
}
