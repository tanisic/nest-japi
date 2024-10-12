import { ResourceOptions } from "../decorators/resource.decorator";
import { JsonApiModuleOptions } from "./json-api.module";

export class JsonApiOptions {
  global: JsonApiModuleOptions;
  resource: ResourceOptions;

  constructor({
    global,
    resource,
  }: {
    global: JsonApiModuleOptions;
    resource: ResourceOptions;
  }) {
    this.global = global;
    this.resource = resource;
  }
}
