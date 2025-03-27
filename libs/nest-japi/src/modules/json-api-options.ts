import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { ResourceOptions } from "../decorators/resource.decorator";
import { JsonApiModuleOptions } from "./json-api.module";

export class JsonApiOptions {
  global: JsonApiModuleOptions;
  resource: ResourceOptions;

  maxAllowedPagination: number;

  constructor({
    global,
    resource,
  }: {
    global: JsonApiModuleOptions;
    resource: ResourceOptions;
  }) {
    this.global = global;
    this.resource = resource;

    this.maxAllowedPagination =
      this.resource.maxPaginationSize ||
      this.global.maxPaginationSize ||
      DEFAULT_PAGINATION_SIZE;
  }
}
